// src/models/NotificationModel.ts
import mongoose, { Schema, Document, Types } from 'mongoose';
import { NotificationStatus, NotificationType } from '../types/notification';



export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: any; // additional data like appointment ID, message ID, etc.
  status: NotificationStatus;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string; // URL for frontend navigation
  scheduledFor?: Date; // for scheduled notifications
  expiresAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'system',
      'message',
      'appointment',
      'role_approval',
      'security',
      'medical',
      'certification_update',
      'certification_verification',
      'profile_update'
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  data: {
    type: Schema.Types.Mixed,
    default: null,
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'dismissed'],
    default: 'unread',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  actionUrl: {
    type: String,
    default: '',
  },
  scheduledFor: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
NotificationSchema.index({ user: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ scheduledFor: 1, status: 1 });
NotificationSchema.index({ expiresAt: 1 });
NotificationSchema.index({ isDeleted: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);