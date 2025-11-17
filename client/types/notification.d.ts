export type SettingsType = {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsAlerts: boolean;
  appUpdates: boolean;
  reminders: boolean;
}

export type SettingItem = {
  key: keyof SettingsType;
  label: string;
};

// src/types/notification.ts
export type NotificationType = 
  | 'system' 
  | 'message' 
  | 'appointment' 
  | 'role_approval' 
  | 'security' 
  | 'medical';

export type NotificationStatus = 'unread' | 'read' | 'dismissed';

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  status: NotificationStatus;
  priority: NotificationPriority;
  actionUrl?: string;
  scheduledFor?: string; // ISO date
  expiresAt?: string; // ISO date
  isDeleted: boolean;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface NotificationFilters {
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  page?: number;
  limit?: number;
  startDate?: string; // ISO date
  endDate?: string; // ISO date
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  dismissed: number;
  byType: Record<NotificationType, number>;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
}

export interface MarkAsReadResponse {
  id: string;
  status: NotificationStatus;
  updatedAt: string;
}

export interface MarkAllAsReadResponse {
  message: string;
  modifiedCount: number;
}

export interface DeleteNotificationResponse {
  message: string;
}

// For real-time notifications via WebSocket
export interface RealTimeNotification {
  type: 'new_notification' | 'notification_read' | 'notification_dismissed';
  data: Notification;
}

// For push notifications
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: {
    notificationId?: string;
    type?: NotificationType;
    actionUrl?: string;
    [key: string]: any;
  };
}