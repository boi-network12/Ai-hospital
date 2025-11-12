// src/controllers/userController.ts
import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { AuthRequest } from '../middlewares/authMiddleware';

type AuthReq = AuthRequest;

/* ---------- Get my profile ---------- */
export const getMyProfile = async (req: AuthReq, res: Response) => {
  const user = await userService.getUserById(req.user._id);
  res.json(user);
};

/* ---------- General profile update (everything except email, password, notifications, avatar) ---------- */
export const updateMyProfile = async (req: AuthReq, res: Response) => {
  const updated = await userService.updateProfileGeneral(req.user._id, req.body);
  res.json(updated);
};

/* ---------- Avatar (stub) ---------- */
export const updateAvatar = async (req: AuthReq, res: Response) => {
  // TODO: implement file upload (multer / cloudinary / s3)
  res.status(501).json({ message: 'Avatar upload not implemented yet' });
};

/* ---------- Email update ---------- */
export const updateEmail = async (req: AuthReq, res: Response) => {
  const { email } = req.body;
  const updated = await userService.updateEmail(req.user._id, email);
  res.json(updated);
};

/* ---------- Change password ---------- */
export const updatePassword = async (req: AuthReq, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await userService.changePassword(req.user._id, currentPassword, newPassword);
  res.json({ message: 'Password updated successfully' });
};

/* ---------- Notification settings ---------- */
export const updateNotifications = async (req: AuthReq, res: Response) => {
  const updated = await userService.updateNotificationSettings(req.user._id, req.body);
  res.json(updated);
};

/* ---------- Devices ---------- */
export const getMyDevices = async (req: AuthReq, res: Response) => {
  const devices = await userService.listDevices(req.user._id);
  res.json(devices);
};

export const revokeDevice = async (req: AuthReq, res: Response) => {
  const { token } = req.body;
  await userService.revokeDevice(req.user._id, token);
  res.json({ message: 'Device revoked' });
};

/* ---------- Public profile ---------- */
export const getUserProfile = async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};