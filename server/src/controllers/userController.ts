// src/controllers/userController.ts
import { Request, Response } from 'express';
import * as userService from '../services/userService';

interface AuthReq extends Request {
  user?: any;
}

/* ---------- Get my profile ---------- */
export const getMyProfile = async (req: AuthReq, res: Response) => {
  const user = await userService.getUserById(req.user._id);
  res.json(user);
};

/* ---------- Update profile (any allowed field) ---------- */
export const updateMyProfile = async (req: AuthReq, res: Response) => {
  const updated = await userService.updateProfile(req.user._id, req.body);
  res.json(updated);
};

/* ---------- List logged-in devices ---------- */
export const getMyDevices = async (req: AuthReq, res: Response) => {
  const devices = await userService.listDevices(req.user._id);
  res.json(devices);
};

/* ---------- Revoke a device (logout from other device) ---------- */
export const revokeDevice = async (req: AuthReq, res: Response) => {
  const { token } = req.body;
  await userService.revokeDevice(req.user._id, token);
  res.json({ message: 'Device revoked' });
};

/* ---------- Existing getUserProfile (public) ---------- */
export const getUserProfile = async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};