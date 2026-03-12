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
const userSkill_model_1 = require("../models/userSkill.model");
// Add Skill to User profile
const add = (userId, data) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate required fields
    if (!data.skill_id || !data.type) {
        throw new Error('Skill ID and Type (TEACH/LEARN) are required.');
    }
    // Check for duplicates
    const existing = yield userSkill_model_1.UserSkill.findOne({
        user_id: userId,
        skill_id: data.skill_id,
        type: data.type,
    });
    if (existing) {
        throw new Error(`You already have this skill listed as ${data.type}.`);
    }
    // Create the entry
    const newEntry = yield userSkill_model_1.UserSkill.create(Object.assign(Object.assign({}, data), { user_id: userId }));
    // Return result
    return yield newEntry.populate('skill_id', 'name category');
});
// Get all Skills for a User
const getByUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield userSkill_model_1.UserSkill.find({ user_id: userId })
        .populate('skill_id', 'name category')
        .sort({ createdAt: -1 });
});
// Update a User Skill
const update = (userSkillId, userId, updates) => __awaiter(void 0, void 0, void 0, function* () {
    // Prevent user from changing the owner (user_id) or the skill itself (skill_id)
    delete updates.user_id;
    delete updates.skill_id;
    const updatedSkill = yield userSkill_model_1.UserSkill.findOneAndUpdate({ _id: userSkillId, user_id: userId }, updates, { new: true }).populate('skill_id', 'name category');
    if (!updatedSkill) {
        throw new Error('Skill not found or you do not have permission to edit it.');
    }
    return updatedSkill;
});
// Remove a Skill from User
const remove = (userSkillId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const deleted = yield userSkill_model_1.UserSkill.findOneAndDelete({
        _id: userSkillId,
        user_id: userId,
    });
    if (!deleted) {
        throw new Error('Skill not found or you do not have permission to delete it.');
    }
    return deleted;
});
exports.default = {
    add,
    getByUser,
    update,
    remove,
};
