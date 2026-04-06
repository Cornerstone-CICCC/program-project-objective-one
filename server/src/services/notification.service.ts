import { INotification, Notification } from '../models/notification.model';

// Create a new notification
const createNotification = async (data: Partial<INotification>) => {
  return await Notification.create(data);
};

// Get recent notifications for a specific user
const getUserNotifications = async (userId: string) => {
  return Notification.find({ recipient_id: userId }).sort({ createAt: -1 }).limit(50); // Limit to recent 50
};

// Mark a single notification as read
const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient_id: userId },
    { is_read: true },
    { new: true },
  );

  if (!notification) {
    throw new Error('Notification not found or unauthorized.');
  }

  return notification;
};

// Mark all unread notifications for a user as read
const markAllAsRead = async (userId: string) => {
  const result = await Notification.updateMany(
    { recipient_id: userId, is_read: false },
    { is_read: true },
  );

  return result;
};

// Delete a single notification by ID
const deleteSingleNotification = async (notificationId: string, userId: string) => {
  const result = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient_id: userId,
  });

  if (!result) {
    throw new Error('Notification not found or unauthorized.');
  }

  return result;
};

// Delete all read notifications for a user (Inbox Cleanup)
const clearReadNotifications = async (userId: string) => {
  const result = await Notification.deleteMany({
    recipient_id: userId,
    is_read: true,
  });

  return result;
};

// A hard wipe of everything
const clearAllNotifications = async (userId: string) => {
  return await Notification.deleteMany({ recipient_id: userId });
};

export default {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteSingleNotification,
  clearReadNotifications,
  clearAllNotifications,
};
