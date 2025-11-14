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
  const body = req.body;

  // 1. Validate body exists and is object
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ message: 'Invalid request body: must be a JSON object' });
  }

  // 2. Allow empty object → no changes
  if (Object.keys(body).length === 0) {
    const user = await userService.getUserById(req.user._id);
    return res.json(user);
  }

  try {
    const updatedUser = await userService.updateProfileGeneral(req.user._id, body);
    return res.json(updatedUser);
  } catch (err: any) {
    // Service throws meaningful errors
    return res.status(400).json({ message: err.message });
  }
};

/* ---------- Avatar (stub) ---------- */
export const updateAvatar = async (req: AuthReq, res: Response) => {
  // TODO: implement file upload (multer / cloudinary / s3)
  res.status(501).json({ message: 'Avatar upload not implemented yet' });
};

/* ---------- Email update ---------- */
export const updateEmail = async (req: AuthReq, res: Response) => {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ message: 'Invalid request body' });
  }

  const { email: rawEmail } = body;

  if (!rawEmail || typeof rawEmail !== 'string' || rawEmail.trim() === '') {
    return res.status(400).json({ message: 'Email is required' });
  }

  const newEmail = rawEmail.trim().toLowerCase();

  try {
    const updatedUser = await userService.updateEmail(req.user._id, newEmail);
    return res.json(updatedUser);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ---------- Change password ---------- */
export const updatePassword = async (req: AuthReq, res: Response) => {
  const body = req.body;

  // -------------------------------------------------
  // 1. Validate request body (exactly like updateEmail)
  // -------------------------------------------------
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ message: 'Invalid request body: must be a JSON object' });
  }

  const { currentPassword, newPassword } = body;

  // -------------------------------------------------
  // 2. Validate required fields + types
  // -------------------------------------------------
  if (!currentPassword || typeof currentPassword !== 'string') {
    return res.status(400).json({ message: 'Current password is required' });
  }
  if (!newPassword || typeof newPassword !== 'string') {
    return res.status(400).json({ message: 'New password is required' });
  }

  // -------------------------------------------------
  // 3. Optional: enforce minimum length / complexity
  // -------------------------------------------------
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' });
  }

  // -------------------------------------------------
  // 4. Call service – it throws on failure
  // -------------------------------------------------
  try {
    await userService.changePassword(req.user._id, currentPassword, newPassword);
    return res.json({ message: 'Password updated successfully' });
  } catch (err: any) {
    // Service throws:
    //   • "User not found"
    //   • "Current password is incorrect"
    //   • Validation errors from bcrypt / schema
    return res.status(400).json({ message: err.message });
  }
};

/* ---------- Notification settings ---------- */
export const updateNotifications = async (req: AuthReq, res: Response) => {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ message: 'Invalid request body: must be a JSON object' });
  }

  try {
    const updatedUser = await userService.updateNotificationSettings(req.user._id, body);
    return res.json(updatedUser);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};


/* ---------- Devices ---------- */
export const getMyDevices = async (req: AuthReq, res: Response) => {
  const devices = await userService.listDevices(req.user._id);
  res.json(devices);
};

// src/controllers/userController.ts
export const revokeDevice = async (req: AuthReq, res: Response) => {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ message: 'Invalid request body' });
  }

  const { token } = body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    await userService.revokeDevice(req.user._id, token);
    return res.json({ message: 'Device removed' });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/* ---------- Public profile ---------- */
export const getUserProfile = async (req: Request, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};