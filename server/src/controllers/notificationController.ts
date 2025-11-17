// src/controllers/notificationController.ts
import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import * as notificationService from '../services/notificationService';
import { INotificationFilters } from '../types/notification';


/* ---------- Get user notifications ---------- */
export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  const filters: INotificationFilters = {
    type: req.query.type as any,
    status: req.query.status as any,
    priority: req.query.priority as any,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
    endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
  };

  try {
    const data = await notificationService.getUserNotifications(req.user._id, filters);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/* ---------- Get notification statistics ---------- */
export const getNotificationStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await notificationService.getNotificationStats(req.user._id);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/* ---------- Mark notification as read ---------- */
export const markAsRead = async (req: AuthRequest, res: Response) => {
  const { notificationId } = req.params;

  try {
    const notification = await notificationService.markAsRead(req.user._id, notificationId);
    res.json(notification);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

/* ---------- Mark all notifications as read ---------- */
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);
    res.json({ message: `${result.modifiedCount} notifications marked as read` });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/* ---------- Dismiss notification ---------- */
export const dismissNotification = async (req: AuthRequest, res: Response) => {
  const { notificationId } = req.params;

  try {
    const notification = await notificationService.dismissNotification(req.user._id, notificationId);
    res.json(notification);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

/* ---------- Delete notification ---------- */
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  const { notificationId } = req.params;

  try {
    const result = await notificationService.deleteNotification(req.user._id, notificationId);
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};