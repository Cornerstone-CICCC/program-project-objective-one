"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const network_controller_1 = __importDefault(require("../controllers/network.controller"));
const networkRouter = (0, express_1.Router)();
networkRouter.get('/pulse', auth_middleware_1.protect, network_controller_1.default.getNetworkPulse);
exports.default = networkRouter;
