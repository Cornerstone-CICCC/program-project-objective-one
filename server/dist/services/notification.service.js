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
const notification_model_1 = require("../models/notification.model");
// Create a new notification
const createNotification = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield notification_model_1.Notification.create(data);
});
// Get recent notifications for a specific user
const getUserNotifications = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return notification_model_1.Notification.find({ recipient_id: userId }).sort({ createAt: -1 }).limit(50); // Limit to recent 50
});
// Mark a single notification as read
const markAsRead = (notificationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_model_1.Notification.findOneAndUpdate({ _id: notificationId, recipient_id: userId }, { is_read: true }, { new: true });
    if (!notification) {
        throw new Error('Notification not found or unauthorized.');
    }
    return notification;
});
// Mark all unread notifications for a user as read
const markAllAsRead = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.Notification.updateMany({ recipient_id: userId, is_read: false }, { is_read: true });
    return result;
});
// Delete a single notification by ID
const deleteSingleNotification = (notificationId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.Notification.findOneAndDelete({
        _id: notificationId,
        recipient_id: userId,
    });
    if (!result) {
        throw new Error('Notification not found or unauthorized.');
    }
    return result;
});
// Delete all read notifications for a user (Inbox Cleanup)
const clearReadNotifications = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.Notification.deleteMany({
        recipient_id: userId,
        is_read: true,
    });
    return result;
});
// A hard wipe of everything
const clearAllNotifications = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield notification_model_1.Notification.deleteMany({ recipient_id: userId });
});
exports.default = {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteSingleNotification,
    clearReadNotifications,
    clearAllNotifications,
};
