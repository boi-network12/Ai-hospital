// src/services/notificationService.ts
import Notification from '../models/NotificationModel';
import { INotificationCreate, INotificationFilters, INotificationLean, INotificationStats, NotificationType } from '../types/notification.d';
import { Types } from 'mongoose';

/* ---------- Create notification ---------- */
export const createNotification = async (data: INotificationCreate) => {
  const notification = new Notification({
    user: data.user,
    type: data.type,
    title: data.title,
    message: data.message,
    data: data.data || null,
    priority: data.priority || 'medium',
    actionUrl: data.actionUrl || '',
    scheduledFor: data.scheduledFor || null,
    expiresAt: data.expiresAt || null,
  });

  await notification.save();

  // Emit real-time event (for WebSocket)
  // You can integrate this with your Socket.io setup
  // emitNotification(notification);

  return notification;
};

/* ---------- Create multiple notifications ---------- */
export const createBulkNotifications = async (notificationsData: INotificationCreate[]) => {
  const notifications = notificationsData.map(data => ({
    user: data.user,
    type: data.type,
    title: data.title,
    message: data.message,
    data: data.data || null,
    priority: data.priority || 'medium',
    actionUrl: data.actionUrl || '',
    scheduledFor: data.scheduledFor || null,
    expiresAt: data.expiresAt || null,
  }));

  const created = await Notification.insertMany(notifications);
  return created;
};

/* ---------- Get user notifications ---------- */
export const getUserNotifications = async (
  userId: string,
  filters: INotificationFilters = {}
): Promise<{
  notifications: Array<Omit<INotificationLean, '_id'> & { id: string }>;
  total: number;
  page: number;
  limit: number;
}> => {
  const {
    type,
    status,
    priority,
    page = 1,
    limit = 20,
    startDate,
    endDate
  } = filters;

  const query: any = {
    user: new Types.ObjectId(userId),
    isDeleted: false,
  };

  if (type) query.type = type;
  if (status) query.status = status;
  if (priority) query.priority = priority;

  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  // Handle expired notifications
  query.$or = [
    { expiresAt: null },
    { expiresAt: { $gt: new Date() } }
  ];

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1, priority: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  const serializedNotifications = notifications.map((notification) => ({
    ...notification,
    id: notification._id.toString(),
    _id: undefined,
  }));

  const total = await Notification.countDocuments(query);

  return {
    notifications: serializedNotifications,
    total,
    page,
    limit
  };
};

/* ---------- Mark as read ---------- */
export const markAsRead = async (userId: string, notificationId: string) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    user: userId,
    isDeleted: false,
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  notification.status = 'read';
  notification.updatedAt = new Date();
  await notification.save();

  return notification;
};

/* ---------- Mark all as read ---------- */
export const markAllAsRead = async (userId: string) => {
  const result = await Notification.updateMany(
    {
      user: userId,
      status: 'unread',
      isDeleted: false,
    },
    {
      $set: {
        status: 'read',
        updatedAt: new Date(),
      }
    }
  );

  return { modifiedCount: result.modifiedCount };
};

/* ---------- Dismiss notification ---------- */
export const dismissNotification = async (userId: string, notificationId: string) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    user: userId,
    isDeleted: false,
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  notification.status = 'dismissed';
  notification.updatedAt = new Date();
  await notification.save();

  return notification;
};

/* ---------- Delete notification (soft delete) ---------- */
export const deleteNotification = async (userId: string, notificationId: string) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    user: userId,
    isDeleted: false,
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  notification.isDeleted = true;
  notification.deletedAt = new Date();
  await notification.save();

  return { message: 'Notification deleted' };
};

/* ---------- Get notification statistics ---------- */
export const getNotificationStats = async (userId: string): Promise<INotificationStats> => {
  const stats = await Notification.aggregate([
    {
      $match: {
        user: new Types.ObjectId(userId),
        isDeleted: false,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ],
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: {
          $sum: { $cond: [{ $eq: ['$status', 'unread'] }, 1, 0] },
        },
        read: {
          $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] },
        },
        dismissed: {
          $sum: { $cond: [{ $eq: ['$status', 'dismissed'] }, 1, 0] },
        },
        byType: {
          $push: {
            type: '$type',
            count: 1,
          },
        },
      },
    },
    {
      $project: {
        total: 1,
        unread: 1,
        read: 1,
        dismissed: 1,
        byType: {
          $arrayToObject: {
            $map: {
              input: '$byType',
              as: 'item',
              in: {
                k: '$$item.type',
                v: {
                  $sum: '$$item.count',
                },
              },
            },
          },
        },
      },
    },
  ]);

  const defaultStats: INotificationStats = {
    total: 0,
    unread: 0,
    read: 0,
    dismissed: 0,
    byType: {
      system: 0,
      message: 0,
      appointment: 0,
      role_approval: 0,
      security: 0,
      medical: 0,
      certification_update: 0,
      certification_verification: 0,
    },
  };

  return stats[0] ? {
    total: stats[0].total,
    unread: stats[0].unread,
    read: stats[0].read,
    dismissed: stats[0].dismissed,
    byType: { ...defaultStats.byType, ...stats[0].byType },
  } : defaultStats;
};

/* ---------- Clean up expired notifications ---------- */
export const cleanupExpiredNotifications = async () => {
  const result = await Notification.updateMany(
    {
      expiresAt: { $lte: new Date() },
      isDeleted: false,
    },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  return { deletedCount: result.modifiedCount };
};

/* ---------- Notification Templates ---------- */
export const NotificationTemplates = {
  // Login security notifications
  loginSuccess: (device: string, location: string) => ({
    title: 'Login Successful',
    message: `New login detected from ${device} in ${location}. If this wasn't you, please secure your account.`,
    type: 'security' as const,
    priority: 'medium' as const,
    actionUrl: '/security',
  }),

  passwordChanged: () => ({
    title: 'Password Changed',
    message: 'Your password has been successfully changed.',
    type: 'security' as const,
    priority: 'medium' as const,
  }),

  emailChanged: (oldEmail: string, newEmail: string) => ({
    title: 'Email Address Updated',
    message: `Your email has been changed from ${oldEmail} to ${newEmail}.`,
    type: 'security' as const,
    priority: 'high' as const,
  }),

  // Role approval notifications
  roleApproved: (role: string) => ({
    title: 'Role Request Approved',
    message: `Congratulations! Your request to become a ${role} has been approved. You can now access ${role} features.`,
    type: 'role_approval' as const,
    priority: 'high' as const,
    actionUrl: '/profile',
  }),

  roleRejected: (role: string, adminNote?: string) => ({
    title: 'Role Request Rejected',
    message: `Your request to become a ${role} was rejected. ${adminNote ? `Reason: ${adminNote}` : 'Please contact support for more information.'}`,
    type: 'role_approval' as const,
    priority: 'medium' as const,
    actionUrl: '/support',
  }),

  roleUpdated: (oldRole: string, newRole: string) => ({
    title: 'Role Updated',
    message: `Your role has been changed from ${oldRole} to ${newRole} by an administrator.`,
    type: 'role_approval' as const,
    priority: 'high' as const,
    actionUrl: '/profile',
  }),

  // User status notifications
  userRestricted: () => ({
    title: 'Account Restricted',
    message: 'Your account has been restricted by an administrator. Some features may be unavailable.',
    type: 'security' as const,
    priority: 'high' as const,
    actionUrl: '/support',
  }),

  userUnrestricted: () => ({
    title: 'Account Restriction Lifted',
    message: 'Your account restrictions have been lifted. All features are now available.',
    type: 'security' as const,
    priority: 'medium' as const,
  }),

  // Profile update notifications
  profileUpdated: (fields: string[]) => ({
    title: 'Profile Updated',
    message: `Your profile has been updated. Changed fields: ${fields.join(', ')}.`,
    type: 'system' as const,
    priority: 'low' as const,
    actionUrl: '/profile',
  }),
};

/* ---------- Send notification wrapper ---------- */
export const sendNotification = async (data: {
  userId: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  actionUrl?: string;
  data?: any;
}) => {
  return await createNotification({
    user: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    priority: data.priority || 'medium',
    actionUrl: data.actionUrl || '',
    data: data.data || null,
  });
};