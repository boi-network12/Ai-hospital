import { Request, Response } from 'express';
import * as adminService from '../services/adminService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { UserRole } from '../types/usersDetails';

/* ---------- Create any user ---------- */
export const createUser = async (req: AuthRequest, res: Response) => {
  const { email, password, name, phoneNumber, role, gender, dateOfBirth } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const user = await adminService.adminCreateUser({
      email,
      password,
      name,
      phoneNumber,
      role: role as UserRole,
      gender,
      dateOfBirth,
    });
    res.status(201).json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ---------- Update role ---------- */
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;
  if (!role) return res.status(400).json({ message: 'role required' });
  try {
    const user = await adminService.adminUpdateUserRole(userId, role as UserRole);
    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ---------- Toggle restrict ---------- */
export const toggleRestrict = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { restrict } = req.body;
  if (typeof restrict !== 'boolean') return res.status(400).json({ message: 'restrict boolean required' });
  try {
    const user = await adminService.adminToggleRestrict(userId, restrict);
    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ---------- Delete user ---------- */
export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  try {
    const result = await adminService.adminDeleteUser(userId);
    res.json(result);
  } catch (e: any) {
    res.status(404).json({ message: e.message });
  }
};

/* ---------- List users ---------- */
export const listUsers = async (req: AuthRequest, res: Response) => {
  const { role, search, page, limit } = req.query as any;
  try {
    const data = await adminService.adminListUsers({
      role: role as UserRole | undefined,
      search: search as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ---------- Get any profile ---------- */
export const getAnyProfile = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  try {
    const user = await adminService.adminGetUserProfile(userId);
    res.json(user);
  } catch (e: any) {
    res.status(404).json({ message: e.message });
  }
};

/* ---------- Analytics ---------- */
export const analytics = async (_: AuthRequest, res: Response) => {
  try {
    const data = await adminService.adminAnalytics();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

/* ---------- Approve / Reject role request ---------- */
export const handleRoleRequest = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { approve, adminNote } = req.body;
  if (typeof approve !== 'boolean') return res.status(400).json({ message: 'approve boolean required' });
  try {
    const user = await adminService.adminHandleRoleRequest(userId, approve, adminNote);
    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};