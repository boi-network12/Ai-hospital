// src/utils/notificationUtils.ts
import * as notificationService from '../services/notificationService';
import { INotificationCreate } from '../types/notification';

/* ---------- Common notification templates ---------- */
export const NotificationTemplates = {
  // Role approval notifications
  roleApproved: (role: string, userName: string) => ({
    title: 'Role Request Approved',
    message: `Congratulations ${userName}! Your request to become a ${role} has been approved.`,
    type: 'role_approval' as const,
    priority: 'high' as const,
    actionUrl: '/profile',
  }),

  roleRejected: (role: string, userName: string, adminNote?: string) => ({
    title: 'Role Request Rejected',
    message: `Your request to become a ${role} was rejected. ${adminNote ? `Reason: ${adminNote}` : ''}`,
    type: 'role_approval' as const,
    priority: 'medium' as const,
    actionUrl: '/support',
  }),

  // Security notifications
  newDeviceLogin: (device: string, location: string) => ({
    title: 'New Device Login',
    message: `New login detected from ${device} in ${location}. If this wasn't you, please secure your account.`,
    type: 'security' as const,
    priority: 'high' as const,
    actionUrl: '/security',
  }),

  passwordChanged: () => ({
    title: 'Password Changed',
    message: 'Your password has been successfully changed.',
    type: 'security' as const,
    priority: 'medium' as const,
  }),

  // System notifications
  welcome: (userName: string) => ({
    title: 'Welcome to NeuroMed AI!',
    message: `Hello ${userName}! Welcome to our platform. We're glad to have you here.`,
    type: 'system' as const,
    priority: 'low' as const,
  }),

  // Medical notifications
  appointmentReminder: (doctorName: string, date: string, time: string) => ({
    title: 'Appointment Reminder',
    message: `You have an appointment with Dr. ${doctorName} on ${date} at ${time}.`,
    type: 'appointment' as const,
    priority: 'medium' as const,
    actionUrl: '/appointments',
  }),

  // Message notifications
  newMessage: (fromUser: string, preview: string) => ({
    title: `New message from ${fromUser}`,
    message: preview,
    type: 'message' as const,
    priority: 'medium' as const,
    actionUrl: '/messages',
  }),
};

/* ---------- Send notification helper ---------- */
export const sendNotification = async (notificationData: INotificationCreate) => {
  try {
    return await notificationService.createNotification(notificationData);
  } catch (error) {
    console.error('Failed to send notification:', error);
    throw error;
  }
};

/* ---------- Send multiple notifications ---------- */
export const sendBulkNotifications = async (notificationsData: INotificationCreate[]) => {
  try {
    return await notificationService.createBulkNotifications(notificationsData);
  } catch (error) {
    console.error('Failed to send bulk notifications:', error);
    throw error;
  }
};