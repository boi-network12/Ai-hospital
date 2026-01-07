// src/types/notificationTypes.ts
import { Types } from 'mongoose';

export type NotificationType =
  | 'system'
  | 'message'
  | 'appointment'
  | 'role_approval'
  | 'security'
  | 'medical'
  | 'certification_update'
  | 'certification_verification'
  | 'profile_update'
  | 'general_announcement'
  | 'booking_request'
  | 'booking_updated'
  | 'booking_cancelled'
  | 'booking_status_changed'
  | 'tax_update'
  | 'tax_document'
  | 'tax_verification'
  | 'tax_removal'
  | 'career_review'
  | 'compliance_reminder';

export type NotificationStatus = 'unread' | 'read' | 'dismissed';

export interface INotificationLean {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  status: NotificationStatus;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  scheduledFor?: Date;
  expiresAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationCreate {
  user: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high';
  actionUrl?: string;
  scheduledFor?: Date;
  expiresAt?: Date;
}

export interface INotificationFilters {
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: 'low' | 'medium' | 'high';
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface INotificationStats {
  total: number;
  unread: number;
  read: number;
  dismissed: number;
  byType: Record<NotificationType, number>;
}