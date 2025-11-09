// src/services/userService.ts
import User from '../models/UserModel';
import { Types } from 'mongoose';
import { ISession } from '../types/usersDetails';

export const getUserById = async (id: string) => {
  return await User.findById(id).select('-password -sessions.token');
};

export const updateProfile = async (userId: string, updates: any) => {
  const allowed = [
    'name',
    'phoneNumber',
    'profile.avatar',
    'profile.location.city',
    'profile.location.state',
    'profile.location.country',
    'profile.dateOfBirth',
    'profile.gender',
    'profile.bloodGroup',
    'profile.genotype',
    'profile.height',
    'profile.weight',
    'profile.specialization',
    'profile.department',
    'profile.bio',
    'emergencyContact',
    'notificationSettings',
  ];

  const toSet: any = {};
  for (const key of Object.keys(updates)) {
    if (allowed.includes(key)) toSet[key] = updates[key];
  }
  toSet.updatedAt = new Date();

  return await User.findByIdAndUpdate(userId, { $set: toSet }, { new: true }).select(
    '-password -sessions.token'
  );
};

export const listDevices = async (userId: string) => {
  const user = await User.findById(userId).select('sessions');
  return user?.sessions?.map((s: ISession) => ({
    device: s.device,
    ipAddress: s.ipAddress,
    lastActive: s.lastActive,
    active: s.active,
  }));
};

export const revokeDevice = async (userId: string, token: string) => {
  await User.updateOne(
    { _id: userId, 'sessions.token': token },
    { $set: { 'sessions.$.active': false } }
  );
};