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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ai_service_1 = __importDefault(require("../services/ai.service"));
/**
 * Get AI-generated trade matches for the current user
 * @route GET /ai/matches
 */
const getAIMatches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const matches = yield ai_service_1.default.generateMatches(userId);
        res.status(200).json(matches);
    }
    catch (err) {
        console.error('AI Matchmaking Controller Error:', err);
        if (err.message.includes('must add offering and seeking skills')) {
            return res.status(400).json({
                message: err.message,
            });
        }
        res.status(500).json({
            message: 'Failed to generate AI matches. Please try again later.',
        });
    }
});
exports.default = {
    getAIMatches,
};
