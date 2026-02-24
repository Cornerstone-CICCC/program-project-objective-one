"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const location_controller_1 = __importDefault(require("../controllers/location.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const locationRouter = (0, express_1.Router)();
locationRouter.put('/update', auth_middleware_1.protect, location_controller_1.default.updateLocation);
locationRouter.get('/nearby', auth_middleware_1.protect, location_controller_1.default.getNearby);
exports.default = locationRouter;
