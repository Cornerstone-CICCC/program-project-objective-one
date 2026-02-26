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
const userSkill_service_1 = __importDefault(require("../services/userSkill.service"));
/**
 * Add a Skill to My Profile
 * @route POST /user-skills
 */
const addUserSkill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { skill_id, type, proficiency, description } = req.body;
        // Basic validation
        if (!skill_id || !type) {
            return res.status(400).json({
                message: 'Skill and Type (TEACH/LEARN) are required.',
            });
        }
        const newSkill = yield userSkill_service_1.default.add(userId, {
            skill_id,
            type,
            proficiency,
            description,
        });
        res.status(201).json(newSkill);
    }
    catch (err) {
        if (err.message.includes('already have this skill')) {
            return res.status(409).json({
                message: err.message,
            });
        }
        console.error('Add skill error:', err);
        res.status(500).json({
            message: 'Server error adding skill.',
        });
    }
});
/**
 * Get My Skills
 * @route GET /user-skills/me
 */
const getMySkills = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const skills = yield userSkill_service_1.default.getByUser(userId);
        res.status(200).json(skills);
    }
    catch (err) {
        res.status(500).json({
            message: 'Error fetching your skills.',
        });
    }
});
/**
 * Get Skills by User ID (Public Profile View)
 * @route GET /api/user-skills/user/:userId
 */
const getUserSkills = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const skills = yield userSkill_service_1.default.getByUser(userId);
        res.status(200).json(skills);
    }
    catch (err) {
        res.status(500).json({
            message: 'Error fetching user skills.',
        });
    }
});
/**
 * Update Skill Details (e.g., changed proficiency)
 * @route PUT /user-skills/:id
 */
const updateUserSkill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body;
        const updatedSkill = yield userSkill_service_1.default.update(id, userId, updates);
        res.status(200).json(updatedSkill);
    }
    catch (err) {
        res.status(400).json({
            message: err.message,
        });
    }
});
/**
 * Remove Skill from Profile
 * @route DELETE /user-skills/:id
 */
const deleteUserSkill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        yield userSkill_service_1.default.remove(id, userId);
        res.status(200).json({
            message: 'Skill removed successfully.',
        });
    }
    catch (err) {
        res.status(400).json({
            message: err.message,
        });
    }
});
exports.default = {
    addUserSkill,
    getMySkills,
    getUserSkills,
    updateUserSkill,
    deleteUserSkill,
};
