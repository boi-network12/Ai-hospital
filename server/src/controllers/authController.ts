// src/controllers/authController.ts
import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as otpService from '../services/otpService';
import User from '../models/UserModel';
import { signAccess, signRefresh } from '../utils/jwt';
import jwt from 'jsonwebtoken';


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
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
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

/* ---------- 5. Forgot password – request OTP ---------- */
export const requestResetOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  await authService.requestRegisterOtp(email); // reuse same OTP logic
  res.json({ message: 'Reset OTP sent' });
};

/* ---------- 6. Verify OTP & set new password ---------- */
export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  if (!otpService.verifyOTP(email, otp))
    return res.status(400).json({ message: 'Invalid OTP' });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.password = await authService.hashPassword(newPassword);
  await user.save();
  res.json({ message: 'Password updated' });
};

/* ---------- 7. Logout (invalidate refresh token) ---------- */
export const logout = async (req: AuthReq, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken && req.user?._id) {
    await User.updateOne(
      { _id: req.user._id, 'sessions.token': refreshToken },
      { $set: { 'sessions.$.active': false } }
    );
  }
  res.clearCookie('refreshToken'); // optional, harmless
  res.json({ message: 'Logged out' });
};