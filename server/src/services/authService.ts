// src/services/authService.ts
import bcrypt from 'bcrypt';
import User from '../models/userModel';
import { generateOTP, requestOtp } from './otpService';
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
  dateOfBirth?: Date;
}) => {
  const exists = await User.findOne({ email: data.email });
  if (exists) throw new Error('Email already registered');

  const role = isAdminEmail(data.email) ? 'admin' : 'user';
  const user = new User({
    ...data,
    password: await hashPassword(data.password),
    role,
    isVerified: true, // email OTP already verified
    verificationMethod: 'email',
  });
  await user.save();
  return user;
};