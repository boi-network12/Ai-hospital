// src/services/otpService.ts
import crypto from 'crypto';
import { sendOtpEmail } from '../utils/email';

// In-memory store for demo – replace with Redis/DB in production
const otpStore = new Map<string, { otp: string; expires: number }>();

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const generateOTP = (): string => {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-char hex
};

export const requestOtp = async (email: string) => {
  const otp = generateOTP();
  const expires = Date.now() + OTP_TTL_MS;

  otpStore.set(email, { otp, expires });

  // Send email
  await sendOtpEmail(email, otp);
};

export const verifyOTP = (email: string, otp: string): boolean => {
  const record = otpStore.get(email);
  if (!record) return false;

  const now = Date.now();
  if (now > record.expires) {
    otpStore.delete(email);
    return false;
  }

  const match = record.otp === otp;
  if (match) otpStore.delete(email);
  return match;
};