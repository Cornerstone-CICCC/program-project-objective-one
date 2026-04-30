"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const skill_controller_1 = __importDefault(require("../controllers/skill.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const skillRouter = (0, express_1.Router)();
skillRouter.get('/', skill_controller_1.default.getSkills);
skillRouter.post('/', auth_middleware_1.protect, skill_controller_1.default.createSkill);
skillRouter.put('/:id', auth_middleware_1.protect, skill_controller_1.default.updateSkill);
skillRouter.delete('/:id', auth_middleware_1.protect, skill_controller_1.default.deleteSkill);
exports.default = skillRouter;
