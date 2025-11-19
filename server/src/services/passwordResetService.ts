import User from '../models/UserModel';
import { hashPassword } from './authService';
import * as notificationService from './notificationService';
import { sendPasswordResetOtpEmail } from '../utils/emailPasswordReset';
import mongoose from 'mongoose';

// SEPARATE store for password reset OTPs
const passwordResetOtpStore = new Map<string, { otp: string; expires: number }>();

const generateOTP = (): string => {
  return require('crypto').randomBytes(3).toString('hex').toUpperCase();
};

export const sendResetOtp = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return; // Silent — no user existence leak
  }

  const userId = (user._id as unknown as mongoose.Types.ObjectId).toString();

  // Generate OTP for password reset
  const otp = generateOTP();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

  // Store in PASSWORD RESET store (not the registration store)
  passwordResetOtpStore.set(normalizedEmail, { otp, expires });

  // Send reset email
  await sendPasswordResetOtpEmail(normalizedEmail, otp);

  // Security notification
  await notificationService.sendNotification({
    userId,
    type: 'security',
    title: 'Password Reset Requested',
    message: 'A password reset was requested for your account. If this was\'nt you, secure your account now.',
    priority: 'high',
    data: { requestedAt: new Date() }
  });
};

export interface ResetPasswordDto {
  email: string;
  otp: string;
  newPassword: string;
}

// NEW: Separate verification for password reset OTPs
const verifyPasswordResetOTP = (email: string, otp: string): boolean => {
  const record = passwordResetOtpStore.get(email);
  if (!record) return false;

  const now = Date.now();
  if (now > record.expires) {
    passwordResetOtpStore.delete(email);
    return false;
  }

  const match = record.otp === otp;
  // DON'T delete immediately - wait until password is actually reset
  return match;
};

// NEW: Clear OTP after successful password reset
const clearPasswordResetOTP = (email: string) => {
  passwordResetOtpStore.delete(email);
};

export const resetPasswordWithOtp = async (dto: ResetPasswordDto) => {
  const { email, otp, newPassword } = dto;
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Verify OTP using PASSWORD RESET store
  const isValidOtp = verifyPasswordResetOTP(normalizedEmail, otp);
  if (!isValidOtp) {
    throw new Error('Invalid or expired OTP');
  }

  // 2. Find user
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new Error('Invalid request');
  }

  const userId = (user._id as unknown as mongoose.Types.ObjectId).toString();

  // 3. Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // 4. Update password + clear all sessions
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        password: hashedPassword,
        updatedAt: new Date(),
        sessions: [] // Log out from all devices
      }
    }
  );

  // 5. CLEAR the OTP only after successful password reset
  clearPasswordResetOTP(normalizedEmail);

  // 6. Success notification
  try {
    await notificationService.sendNotification({
      userId,
      type: 'security',
      title: 'Password Reset Successful',
      message: 'Your password has been changed successfully. You are now logged out from all devices.',
      priority: 'high',
      data: { resetAt: new Date() }
    });
  } catch (err) {
    console.error('Failed to send reset success notification:', err);
  }
};