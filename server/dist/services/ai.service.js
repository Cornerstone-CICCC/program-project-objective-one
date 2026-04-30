"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const generative_ai_1 = require("@google/generative-ai");
const user_model_1 = require("../models/user.model");
const userSkill_model_1 = require("../models/userSkill.model");
const matchmakingCache = new Map();
const pendingRequests = new Map();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 Minutes
// Finds up to 20 users who have overlapping skills with the current user
const getCandidatePoolForAI = (currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const mySkills = yield userSkill_model_1.UserSkill.find({ user_id: currentUserId }).populate('skill_id');
    const myOffers = mySkills.filter((s) => s.type === 'TEACH').map((s) => s.skill_id._id);
    const mySeeks = mySkills.filter((s) => s.type === 'LEARN').map((s) => s.skill_id._id);
    if (myOffers.length === 0 && mySeeks.length === 0) {
        throw new Error('You must add skills to your profile to get AI matches.');
    }
    const matchingUserIds = yield userSkill_model_1.UserSkill.find({
        user_id: { $ne: currentUserId },
        $or: [
            { type: 'TEACH', skill_id: { $in: mySeeks } },
            { type: 'LEARN', skill_id: { $in: myOffers } },
        ],
    }).distinct('user_id');
    const candidates = yield user_model_1.User.find({ _id: { $in: matchingUserIds } })
        .populate('location_id')
        .limit(20);
    const formatUserForAI = (user) => __awaiter(void 0, void 0, void 0, function* () {
        const userSkills = yield userSkill_model_1.UserSkill.find({ user_id: user._id }).populate('skill_id');
        return {
            userId: user._id.toString(),
            name: `${user.firstname} ${user.lastname}`,
            location: user.location_id
                ? `${user.location_id.city}, ${user.location_id.province}`
                : 'Remote',
            rating: user.average_rating || 0,
            bio: user.bio || '',
            offering: userSkills
                .filter((s) => s.type === 'TEACH')
                .map((s) => ({
                skill: s.skill_id.name,
                proficiency: s.proficiency,
                details: s.description || 'None',
            })),
            seeking: userSkills
                .filter((s) => s.type === 'LEARN')
                .map((s) => ({
                skill: s.skill_id.name,
                proficiency: s.proficiency,
                details: s.description || 'None',
            })),
        };
    });
    const currentUserPayload = yield formatUserForAI(Object.assign({ _id: currentUserId }, (yield user_model_1.User.findById(currentUserId).populate('location_id').lean())));
    const candidatesPayload = yield Promise.all(candidates.map((c) => formatUserForAI(c)));
    return {
        currentUser: currentUserPayload,
        candidates: candidatesPayload,
        rawCandidateDocs: candidates,
    };
});
// The Gemini AI Matchmaker
const generateMatches = (currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const now = Date.now();
    const cached = matchmakingCache.get(currentUserId);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        console.log(`[AI Matchmaker] Returning CACHED matches for user: ${currentUserId}`);
        return cached.data;
    }
    if (pendingRequests.has(currentUserId)) {
        console.log(`[AI Matchmaker] Request already in flight for ${currentUserId}, waiting on existing promise...`);
        return pendingRequests.get(currentUserId);
    }
    const matchPromise = (() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            console.log(`[AI Matchmaker] Generating NEW matches from Gemini for user: ${currentUserId}`);
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error('GEMINI_API_KEY is not configured in the environment variables.');
            }
            const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            const data = yield getCandidatePoolForAI(currentUserId);
            if (data.candidates.length === 0) {
                return [];
            }
            const prompt = `
      You are an expert matchmaking algorithm for a skill-swapping platform called Swappa.
      Your job is to evaluate the synergy between the "Current User" and an array of "Candidates".
    
      SCORING RULES:
      1. Skill Overlap (High Weight): Does the candidate offer exactly what the user seeks, and vice versa?
      2. Proficiency Synergy (Medium Weight): An Expert teaching a Beginner is a fantastic match. Two Beginners trying to teach each other is a poor match.
      3. Location (Medium Weight): Are they in the same city or province? Give a bonus if they are.
      4. Descriptions: Read the 'details' section of their skills. Do their specific goals align?
    
      OUTPUT FORMAT:
      You MUST return a JSON array containing an object for every candidate.
      Do not include markdown formatting. Return strictly this JSON structure:
      [
        {
          "userId": "String (must match candidate userId)",
          "matchScore": Number (0 to 100),
          "reason": "String (A 1-2 sentence explanation written directly to the Current User. e.g., 'Jany is an Expert in React Native and lives in your city. Her goals align perfectly with what you are offering.')"
        }
      ]
    
      DATA TO EVALUATE:
      Current User: ${JSON.stringify(data.currentUser)}
      Candidates: ${JSON.stringify(data.candidates)}
      `;
            const modelsToTry = [
                'gemini-2.5-flash-lite',
                'gemini-2.5-flash',
                'gemini-3.1-flash-lite-preview',
                'gemini-3-flash-preview',
            ];
            let responseText = '';
            for (let i = 0; i < modelsToTry.length; i++) {
                const currentModelName = modelsToTry[i];
                try {
                    console.log(`[AI] Attempting request with model: ${currentModelName}...`);
                    const model = genAI.getGenerativeModel({
                        model: currentModelName,
                        generationConfig: { responseMimeType: 'application/json' },
                    });
                    yield new Promise((resolve) => setTimeout(resolve, 300));
                    const result = yield model.generateContent(prompt);
                    responseText = result.response.text();
                    break;
                }
                catch (err) {
                    console.warn(`[AI WARNING] Model ${currentModelName} failed:`, err.message);
                    if (i === modelsToTry.length - 1) {
                        throw new Error(`All Gemini models failed. Last error: ${err.message}`);
                    }
                    console.log(`[AI] Switching to fallback model: ${modelsToTry[i + 1]}...`);
                    yield new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }
            const cleanedText = responseText
                .replace(/```json/gi, '')
                .replace(/```/gi, '')
                .trim();
            const aiScores = JSON.parse(cleanedText);
            const finalMatches = data.rawCandidateDocs.map((dbUser) => {
                const userIdStr = dbUser._id.toString();
                const aiEval = aiScores.find((score) => score.userId === userIdStr);
                const geminiPayload = data.candidates.find((c) => c.userId === userIdStr);
                const userObj = dbUser.toObject();
                return Object.assign(Object.assign({}, userObj), { location: userObj.location_id, offering: geminiPayload ? geminiPayload.offering : [], seeking: geminiPayload ? geminiPayload.seeking : [], aiMatchScore: aiEval ? aiEval.matchScore : 0, aiReason: aiEval ? aiEval.reason : 'AI evaluation unavailable.' });
            });
            const sortedMatches = finalMatches.sort((a, b) => b.aiMatchScore - a.aiMatchScore);
            matchmakingCache.set(currentUserId, {
                data: sortedMatches,
                timestamp: Date.now(),
            });
            return sortedMatches;
        }
        catch (err) {
            console.error('Gemini API Error:', err);
            throw new Error('Failed to generate AI matches due to an LLM processing error.');
        }
        finally {
            pendingRequests.delete(currentUserId);
        }
    }))();
    pendingRequests.set(currentUserId, matchPromise);
    return matchPromise;
});
exports.default = {
    generateMatches,
};
