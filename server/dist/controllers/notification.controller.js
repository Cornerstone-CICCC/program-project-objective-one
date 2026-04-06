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
const notification_service_1 = __importDefault(require("../services/notification.service"));
/**
 * Get All Notifications for Logged-in User
 * @route GET /notifications
 */
const getMyNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const notifications = yield notification_service_1.default.getUserNotifications(userId);
        res.status(200).json(notifications);
    }
    catch (err) {
        console.error('Fetch notifications error:', err);
        res.status(500).json({
            message: 'Server error while fetching notifications.',
        });
    }
});
/**
 * Mark a Single Notification as Read
 * @route PUT /notifications/:id/read
 */
const markAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;
        yield notification_service_1.default.markAsRead(notificationId, userId);
        res.status(200).json({
            success: true,
        });
    }
    catch (err) {
        res.status(400).json({
            message: err.message || 'Failed to update notification.',
        });
    }
});
/**
 * Mark All Unread Notifications as Read
 * @route PUT /notifications/read-all
 */
const markAllAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        yield notification_service_1.default.markAllAsRead(userId);
        res.status(200).json({
            success: true,
        });
    }
    catch (err) {
        res.status(500).json({
            message: 'Failed to clear notifications.',
        });
    }
});
/**
 * Delete a Single Notification
 * @route DELETE /notifications/:id
 */
const deleteNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;
        yield notification_service_1.default.deleteSingleNotification(notificationId, userId);
        res.status(200).json({
            success: true,
            message: 'Notification deleted.',
        });
    }
    catch (err) {
        res.status(400).json({
            message: err.message || 'Failed to delete notification.',
        });
    }
});
/**
 * Clear/Delete Read Notifications
 * @route DELETE /notifications/clear
 */
const clearNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        yield notification_service_1.default.clearReadNotifications(userId);
        res.status(200).json({
            message: 'Logs successfully cleared.',
        });
    }
    catch (err) {
        res.status(500).json({
            message: 'Failed to clear notification logs.',
        });
    }
});
/**
 * HARD WIPE: Delete ALL Notifications
 * @route DELETE /notifications/clear-all
 */
const deleteAllNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        yield notification_service_1.default.clearAllNotifications(userId);
        res.status(200).json({
            message: 'All notifications permanently deleted.',
        });
    }
    catch (err) {
        res.status(500).json({
            message: 'Failed to wipe notifications.',
        });
    }
});
exports.default = {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
    deleteAllNotifications,
};
