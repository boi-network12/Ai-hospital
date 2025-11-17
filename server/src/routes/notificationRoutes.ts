// src/routes/notificationRoutes.ts
import { Router } from 'express';
import * as notificationCtrl from '../controllers/notificationController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// GET /v1/notifications - Get user notifications with filters
router.get('/', notificationCtrl.getMyNotifications);

// GET /v1/notifications/stats - Get notification statistics
router.get('/stats', notificationCtrl.getNotificationStats);

// PATCH /v1/notifications/:notificationId/read - Mark as read
router.patch('/:notificationId/read', notificationCtrl.markAsRead);

// PATCH /v1/notifications/read-all - Mark all as read
router.patch('/read-all', notificationCtrl.markAllAsRead);

// PATCH /v1/notifications/:notificationId/dismiss - Dismiss notification
router.patch('/:notificationId/dismiss', notificationCtrl.dismissNotification);

// DELETE /v1/notifications/:notificationId - Delete notification
router.delete('/:notificationId', notificationCtrl.deleteNotification);

export default router;