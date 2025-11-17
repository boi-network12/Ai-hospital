// src/services/authService.ts
import bcrypt from 'bcrypt';
import User from '../models/UserModel';
import { generateOTP, requestOtp } from './otpService';
import * as notificationService from './notificationService';
import { Types } from 'mongoose';
const { ADMINSEMAIL } = process.env || '';

const ADMIN_EMAILS = (ADMINSEMAIL || '').split(',').map(e => e.trim().toLowerCase());

export const hashPassword = (plain: string) =>
  bcrypt.hash(plain, 10);

export const comparePassword = (plain: string, hash: string) =>
  bcrypt.compare(plain, hash);

export const isAdminEmail = (email: string) =>
  ADMIN_EMAILS.includes(email.toLowerCase());

export const requestRegisterOtp = async (email: string) => {
  // You may want to check if email already exists
  await requestOtp(email);
};

export const completeRegistration = async (data: {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
}) => {
  const exists = await User.findOne({ email: data.email });
  if (exists) throw new Error('Email already registered');

  const role = isAdminEmail(data.email) ? 'admin' : 'user';

  const user = new User({
    email: data.email,
    password: await hashPassword(data.password),
    name: data.name,
    phoneNumber: data.phoneNumber || '',
    role,
    isVerified: true,
    verificationMethod: 'email',
    profile: {
      gender: data.gender || 'Prefer not to say',
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    },
  });

  await user.save();

  try {
    await notificationService.sendNotification({
      userId: user._id as Types.ObjectId,
      type: 'system',
      title: 'Welcome to NeuroMed AI!',
      message: `Hello ${data.name}! Welcome to our platform. We're glad to have you here.`,
      priority: 'low',
      actionUrl: '/profile',
    });
  } catch (error) {
    console.error('Failed to send welcome notification:', error);
  }

  return user;
};