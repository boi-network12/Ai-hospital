// src/services/userService.ts
import User from '../models/UserModel';
import { hashPassword, comparePassword } from './authService';
import { Types } from 'mongoose';
import { ISession } from '../types/usersDetails';

/* ---------- Helpers ---------- */
const selectSafe = '-password -sessions.token';

/* ---------- General profile (allowed fields only) ---------- */
const GENERAL_ALLOWED = [
  'name',
  'phoneNumber',
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
  // Remove this: 'emergencyContact',
  // Add these:
  'emergencyContact.name',
  'emergencyContact.relationship',
  'emergencyContact.phoneNumber',
];

/* ---------- Get user (public or own) ---------- */
export const getUserById = async (id: string) => {
  return await User.findById(id).select(selectSafe);
};

/* ---------- General profile update ---------- */
// src/services/userService.ts
export const updateProfileGeneral = async (userId: string, updates: any) => {
  // console.log('Received updates:', updates);   // <-- keep this

  // 1. Guard – accept empty object as “no changes”
  if (!updates || (typeof updates === 'object' && Object.keys(updates).length === 0)) {
    const user = await User.findById(userId).select(selectSafe);
    if (!user) throw new Error('User not found');
    return user;               // early return, no DB write
  }

  // 2. Reject anything that is NOT an object
  if (typeof updates !== 'object' || updates === null) {
    throw new Error('Invalid update data: updates must be a non-null object');
  }

  const toSet: any = { updatedAt: new Date() };
  let hasChanges = false;

  for (const key of Object.keys(updates)) {
    // ----- numeric fields -------------------------------------------------
    if (key === 'profile.height' || key === 'profile.weight') {
      const num = parseFloat(updates[key]);
      if (!isNaN(num) && num > 0) {
        toSet[key] = num;
        hasChanges = true;
      }
      continue;
    }

    // ----- whitelist -------------------------------------------------------
    if (GENERAL_ALLOWED.includes(key)) {
      toSet[key] = updates[key];
      hasChanges = true;
    }
  }

  // ----- no changes → return current doc ---------------------------------
  if (!hasChanges) {
    const user = await User.findById(userId).select(selectSafe);
    if (!user) throw new Error('User not found');
    return user;
  }

  // ----- DB update --------------------------------------------------------
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: toSet },
    { new: true, runValidators: true }
  ).select(selectSafe);

  if (!updatedUser) throw new Error('User not found');
  return updatedUser;
};

/* ---------- Email update ---------- */
export const updateEmail = async (userId: string, newEmail: string) => {
  if (!newEmail) throw new Error('Email is required');
  const exists = await User.findOne({ email: newEmail });
  if (exists) throw new Error('Email already in use');

  return await User.findByIdAndUpdate(
    userId,
    { $set: { email: newEmail.toLowerCase().trim(), updatedAt: new Date() } },
    { new: true }
  ).select(selectSafe);
};

/* ---------- Change password ---------- */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const match = await comparePassword(currentPassword, user.password);
  if (!match) throw new Error('Current password is incorrect');

  const hashed = await hashPassword(newPassword);
  await User.updateOne(
    { _id: userId },
    { $set: { password: hashed, updatedAt: new Date() } }
  );
};

/* ---------- Notification settings ---------- */
export const updateNotificationSettings = async (userId: string, settings: any) => {
  const allowed = [
    'notificationSettings.emailNotifications',
    'notificationSettings.pushNotifications',
    'notificationSettings.smsNotifications',
  ];
  const toSet: any = { updatedAt: new Date() };
  for (const key of Object.keys(settings)) {
    if (allowed.includes(`notificationSettings.${key}`)) {
      toSet[`notificationSettings.${key}`] = settings[key];
    }
  }

  return await User.findByIdAndUpdate(userId, { $set: toSet }, { new: true }).select(
    selectSafe
  );
};

/* ---------- Devices ---------- */
export const listDevices = async (userId: string) => {
  const user = await User.findById(userId).select('sessions');
  return (
    user?.sessions?.map((s: ISession) => ({
      device: s.device,
      ipAddress: s.ipAddress,
      lastActive: s.lastActive,
      active: s.active,
    })) ?? []
  );
};

export const revokeDevice = async (userId: string, token: string) => {
  await User.updateOne(
    { _id: userId, 'sessions.token': token },
    { $set: { 'sessions.$.active': false, 'sessions.$.lastActive': new Date() } }
  );
};