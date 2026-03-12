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
const skill_service_1 = __importDefault(require("../services/skill.service"));
/**
 * Get All Active Skills
 * @route GET /skills
 * @access Public
 */
const getSkills = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const skills = yield skill_service_1.default.getAll();
        res.status(200).json(skills);
    }
    catch (err) {
        console.error('Error fetching skills:', err);
        res.status(500).json({
            message: 'Server error while fetching skills.',
        });
    }
});
/**
 * Create New Skill
 * @route POST /skills
 * @access Private (Admin)
 */
const createSkill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, category } = req.body;
        if (!name || !category) {
            return res.status(400).json({
                message: 'Name and Category are required.',
            });
        }
        const newSkill = yield skill_service_1.default.create({ name, category });
        res.status(201).json(newSkill);
    }
    catch (err) {
        if (err.message.includes('already exists')) {
            return res.status(409).json({
                message: err.message,
            });
        }
        res.status(500).json({
            message: 'Server error while creating skill.',
        });
    }
});
/**
 * Update Skill (Name or Category)
 * @route PUT /skills/:id
 * @access Private (Admin)
 */
const updateSkill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, category } = req.body;
        const updatedSkill = yield skill_service_1.default.update(id, { name, category });
        if (!updatedSkill) {
            return res.status(404).json({
                message: 'Skill not found.',
            });
        }
        res.status(200).json(updatedSkill);
    }
    catch (err) {
        res.status(500).json({
            message: 'Server error while updating skill.',
        });
    }
});
/**
 * Soft Delete Skill (Hide from list)
 * @route DELETE /skills/:id
 * @access Private (Admin)
 */
const deleteSkill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deletedSkill = yield skill_service_1.default.remove(id);
        if (!deletedSkill) {
            return res.status(404).json({
                message: 'Skill not found.',
            });
        }
        res.status(200).json({
            message: 'Skill deactivated successfully.',
            skill: deletedSkill,
        });
    }
    catch (err) {
        res.status(500).json({
            message: 'Server error while deleting skill.',
        });
    }
});
exports.default = {
    getSkills,
    createSkill,
    updateSkill,
    deleteSkill,
};
