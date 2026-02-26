"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userSkill_controller_1 = __importDefault(require("../controllers/userSkill.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const userSkillRouter = (0, express_1.Router)();
userSkillRouter.post('/', auth_middleware_1.protect, userSkill_controller_1.default.addUserSkill);
userSkillRouter.get('/me', auth_middleware_1.protect, userSkill_controller_1.default.getMySkills);
userSkillRouter.put('/:id', auth_middleware_1.protect, userSkill_controller_1.default.updateUserSkill);
userSkillRouter.delete('/:id', auth_middleware_1.protect, userSkill_controller_1.default.deleteUserSkill);
userSkillRouter.get('/user/:userId', userSkill_controller_1.default.getUserSkills);
exports.default = userSkillRouter;
