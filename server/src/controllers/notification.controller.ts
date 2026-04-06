import { Request, Response } from 'express';
import notificationService from '../services/notification.service';

/**
 * Get All Notifications for Logged-in User
 * @route GET /notifications
 */
const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const notifications = await notificationService.getUserNotifications(userId);

    res.status(200).json(notifications);
  } catch (err: any) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({
      message: 'Server error while fetching notifications.',
    });
  }
};

/**
 * Mark a Single Notification as Read
 * @route PUT /notifications/:id/read
 */
const markAsRead = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const notificationId = req.params.id;

    await notificationService.markAsRead(notificationId, userId);

    res.status(200).json({
      success: true,
    });
  } catch (err: any) {
    res.status(400).json({
      message: err.message || 'Failed to update notification.',
    });
  }
};

/**
 * Mark All Unread Notifications as Read
 * @route PUT /notifications/read-all
 */
const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
    });
  } catch (err: any) {
    res.status(500).json({
      message: 'Failed to clear notifications.',
    });
  }
};

/**
 * Delete a Single Notification
 * @route DELETE /notifications/:id
 */
const deleteNotification = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const notificationId = req.params.id;

    await notificationService.deleteSingleNotification(notificationId, userId);

    res.status(200).json({
      success: true,
      message: 'Notification deleted.',
    });
  } catch (err: any) {
    res.status(400).json({
      message: err.message || 'Failed to delete notification.',
    });
  }
};

/**
 * Clear/Delete Read Notifications
 * @route DELETE /notifications/clear
 */
const clearNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    await notificationService.clearReadNotifications(userId);

    res.status(200).json({
      message: 'Logs successfully cleared.',
    });
  } catch (err: any) {
    res.status(500).json({
      message: 'Failed to clear notification logs.',
    });
  }
};

/**
 * HARD WIPE: Delete ALL Notifications
 * @route DELETE /notifications/clear-all
 */
const deleteAllNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    await notificationService.clearAllNotifications(userId);

    res.status(200).json({
      message: 'All notifications permanently deleted.',
    });
  } catch (err: any) {
    res.status(500).json({
      message: 'Failed to wipe notifications.',
    });
  }
};

export default {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
  deleteAllNotifications,
};
