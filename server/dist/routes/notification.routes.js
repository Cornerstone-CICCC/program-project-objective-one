"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const notification_controller_1 = __importDefault(require("../controllers/notification.controller"));
const notificationRouter = (0, express_1.Router)();
notificationRouter.use(auth_middleware_1.protect);
notificationRouter.get('/', notification_controller_1.default.getMyNotifications);
notificationRouter.put('/read-all', notification_controller_1.default.markAllAsRead);
notificationRouter.put('/:id/read', notification_controller_1.default.markAsRead);
notificationRouter.delete('/clear-read', notification_controller_1.default.clearNotifications);
notificationRouter.delete('/clear-all', notification_controller_1.default.deleteAllNotifications);
notificationRouter.delete('/:id', notification_controller_1.default.deleteNotification);
exports.default = notificationRouter;
