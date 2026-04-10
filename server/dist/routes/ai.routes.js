"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const ai_controller_1 = __importDefault(require("../controllers/ai.controller"));
const aiRouter = (0, express_1.Router)();
aiRouter.get('/matches', auth_middleware_1.protect, ai_controller_1.default.getAIMatches);
exports.default = aiRouter;
