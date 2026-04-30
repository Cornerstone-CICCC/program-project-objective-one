import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import notificationController from '../controllers/notification.controller';

const notificationRouter = Router();

notificationRouter.use(protect);

notificationRouter.get('/', notificationController.getMyNotifications);

notificationRouter.put('/read-all', notificationController.markAllAsRead);
notificationRouter.put('/:id/read', notificationController.markAsRead);

notificationRouter.delete('/clear-read', notificationController.clearNotifications);
notificationRouter.delete('/clear-all', notificationController.deleteAllNotifications);

notificationRouter.delete('/:id', notificationController.deleteNotification);

export default notificationRouter;
