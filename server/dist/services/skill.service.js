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
const skill_model_1 = require("../models/skill.model");
// Get all active skills
const getAll = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield skill_model_1.Skill.find({ is_active: true }).sort({ name: 1 });
});
// Get skill by ID
const getById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield skill_model_1.Skill.findById(id);
});
// Create new skill
const create = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, category } = data;
    if (!name)
        throw new Error('Skill name is required.');
    // Duplicate check
    const existing = yield skill_model_1.Skill.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
    });
    if (existing) {
        throw new Error(`Skill '${name}' already exists!`);
    }
    return yield skill_model_1.Skill.create({
        name,
        category: category || 'Lifestyle',
    });
});
// Update a skill
const update = (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    return yield skill_model_1.Skill.findByIdAndUpdate(id, updates, { new: true });
});
// Soft delete a skill
const remove = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield skill_model_1.Skill.findByIdAndUpdate(id, { is_active: false }, { new: true });
});
exports.default = {
    getAll,
    getById,
    create,
    update,
    remove,
};
