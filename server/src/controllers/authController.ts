// src/controllers/authController.ts
import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as otpService from '../services/otpService';
import * as notificationService from '../services/notificationService';
import * as passwordResetService from '../services/passwordResetService'
import User from '../models/UserModel';
import { signAccess, signRefresh } from '../utils/jwt';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';


interface AuthReq extends Request {
  user?: any;
}

/* ---------- 1. Request OTP for registration ---------- */
export const requestRegisterOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  await authService.requestRegisterOtp(email);
  res.json({ message: 'OTP sent to email' });
};

/* ---------- 2. Verify OTP & finish registration ---------- */
export const register = async (req: Request, res: Response) => {
  const { email, otp, password, name, phoneNumber, gender, dateOfBirth } = req.body;

  if (!otpService.verifyOTP(email, otp))
    return res.status(400).json({ message: 'Invalid or expired OTP' });

  const user = await authService.completeRegistration({
    email,
    password,
    name,
    phoneNumber,
    gender,
    dateOfBirth
  });

  const payload = { sub: user._id, role: user.role };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);

  // store refresh token in sessions array
  user.sessions?.push({
    token: refreshToken,
    device: req.headers['user-agent'] || 'unknown',
    ipAddress: (req.ip || req.connection.remoteAddress) || '',
    lastActive: new Date(),
    active: true,
  });
  await user.save();

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, role: user.role },
  });
};

/* ---------- 3. Login ---------- */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await authService.comparePassword(password, user.password)))
    return res.status(401).json({ message: 'Invalid credentials' });

  const payload = { sub: user._id, role: user.role };
  const accessToken = signAccess(payload);
  const refreshToken = signRefresh(payload);

  user.sessions?.push({
    token: refreshToken,
    device: req.headers['user-agent'] || 'unknown',
    ipAddress: (req.ip || req.connection.remoteAddress) || '',
    lastActive: new Date(),
    active: true,
  });
  await user.save();

  try {
    const device = req.headers['user-agent'] || 'Unknown device';
    const location = req.ip || 'Unknown location';

    await notificationService.sendNotification({
      userId: user._id as Types.ObjectId,
      type: 'security',
      title: 'New Login Detected',
      message: `Successful login from ${device} in ${location}.`,
      priority: 'medium',
      actionUrl: '/security',
      data: {
        device,
        ipAddress: location,
        timestamp: new Date(),
      }
    });
  } catch (error) {
    console.error('Failed to send login notification:', error);
  }

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({
    accessToken,
    refreshToken,
    user: { id: user._id, email: user.email, role: user.role },
  });
};

/* ---------- 4. Refresh token ---------- */
export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body; // Accept from body
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as jwt.JwtPayload;
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const user = await User.findById(payload.sub);
  if (!user) return res.status(401).json({ message: 'User not found' });

  // Optional: Validate token exists in user's sessions
  const session = user.sessions?.find(s => s.token === refreshToken && s.active);
  if (!session) return res.status(401).json({ message: 'Invalid session' });

  const newAccess = signAccess({ sub: user._id, role: user.role });
  res.json({ accessToken: newAccess });
};

/**----------- 5.  Forget password  – request OTP  --------------- */
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    await passwordResetService.sendResetOtp(email.trim().toLowerCase());
    return res.json({
      message: 'If the email exists, an OTP has been sent to reset your password.'
    });
  } catch (err: any) {
    // We don't leak whether email exists
    return res.json({
      message: 'If the email exists, an OTP has been sent to reset your password.'
    });
  }
};

/* ---------- 6. Verify OTP & set new password ---------- */
export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP, and new password are required' });
  }

  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long' });
  }

  try {
    await passwordResetService.resetPasswordWithOtp({
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
      newPassword,
    });

    return res.json({ message: 'Password has been reset successfully' });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};


/* ---------- 7. Logout (invalidate refresh token) ---------- */
export const logout = async (req: AuthReq, res: Response) => {
  try {
    // Try to get refreshToken from multiple sources (in order of preference)
    let refreshToken: string | undefined;

    // 1. From request body (what your mobile app sends)
    if (req.body && typeof req.body === 'object') {
      refreshToken = req.body.refreshToken;
    }

    // 2. Fallback: from cookie (if you ever use httpOnly cookies)
    if (!refreshToken && req.cookies) {
      refreshToken = req.cookies.refreshToken;
    }

    // 3. Fallback: from Authorization header as Bearer (common pattern)
    if (!refreshToken && req.headers.authorization?.startsWith('Bearer ')) {
      refreshToken = req.headers.authorization.split(' ')[1];
    }

    // If we have a token and user is authenticated via JWT middleware
    if (refreshToken && req.user?._id) {
      await User.updateOne(
        { _id: req.user._id, 'sessions.token': refreshToken },
        { $set: { 'sessions.$.active': false } }
      );
    }

    // Clear cookie if exists
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Logout failed' });
  }
};

/* ---------- 8. Delete Account (HARD DELETE) ---------- */
export const deleteAccount = async (req: AuthReq, res: Response) => {
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ message: 'Unauthenticated' });

  // 1. Permanently delete the user
  const deleted = await User.findByIdAndDelete(userId);
  if (!deleted) return res.status(404).json({ message: 'User not found' });

  // 2. (Optional) No need to revoke sessions — document is gone
  // But if you have other collections referencing this user, clean them up

  res.json({ message: 'Account permanently deleted' });
};