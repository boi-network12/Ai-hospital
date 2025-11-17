// src/services/userService.ts
import User from '../models/UserModel';
import { hashPassword, comparePassword } from './authService';
import { Types } from 'mongoose';
import * as notificationService from './notificationService';
import { INotificationSettings, ISession } from '../types/usersDetails';
import { deleteFromCloudinary, uploadToCloudinary } from '../utils/cloudinary';

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
  // 1. Guard – accept empty object as “no changes”
  if (!updates || (typeof updates === 'object' && Object.keys(updates).length === 0)) {
    const user = await User.findById(userId).select(selectSafe);
    if (!user) throw new Error('User not found');
    return user;
  }

  // 2. Reject anything that is NOT an object
  if (typeof updates !== 'object' || updates === null) {
    throw new Error('Invalid update data: updates must be a non-null object');
  }

  const toSet: any = { updatedAt: new Date() };
  let hasChanges = false;
  const changedFields: string[] = [];

  for (const key of Object.keys(updates)) {
    // ----- numeric fields -------------------------------------------------
    if (key === 'profile.height' || key === 'profile.weight') {
      const num = parseFloat(updates[key]);
      if (!isNaN(num) && num > 0) {
        toSet[key] = num;
        hasChanges = true;
        changedFields.push(key.replace('profile.', ''));
      }
      continue;
    }

    // ----- whitelist -------------------------------------------------------
    if (GENERAL_ALLOWED.includes(key)) {
      toSet[key] = updates[key];
      hasChanges = true;

      const fieldName = key
        .replace('profile.', '')
        .replace('emergencyContact.', 'emergency contact ')
        .replace(/\./g, ' ');
      changedFields.push(fieldName);
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

  if (changedFields.length > 0) {
    try {
      await notificationService.sendNotification({
        userId: userId,
        type: 'system',
        title: 'Profile Updated',
        message: `Your profile has been updated. Changed fields: ${changedFields.join(', ')}.`,
        priority: 'low',
        actionUrl: '/profile',
        data: {
          changedFields: changedFields,
          updatedAt: new Date(),
        }
      });
    } catch (error) {
      console.error('Failed to send profile update notification:', error);
      // Don't fail the update if notification fails
    }
  }
  return updatedUser;
};

/* ---------- Email update ---------- */
export const updateEmail = async (userId: string, newEmail: string) => {
  // Guard (defensive – controller already checks)
  if (!newEmail) throw new Error('Email is required');

  // Normalise once here (controller already does it, but safe)
  const normalised = newEmail.toLowerCase().trim();

  const exists = await User.findOne({ email: normalised });
  if (exists) throw new Error('Email already in use');

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { email: normalised, updatedAt: new Date() } },
    { new: true, runValidators: true }
  ).select(selectSafe);

  if (!updatedUser) throw new Error('User not found');
  return updatedUser;
};

/* ---------- Change password ---------- */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId).select('+password'); // need password!
  if (!user) throw new Error('User not found');

  const match = await comparePassword(currentPassword, user.password);
  if (!match) throw new Error('Current password is incorrect');

  // Prevent setting the same password again
  const same = await comparePassword(newPassword, user.password);
  if (same) throw new Error('New password must be different from the current one');

  const hashed = await hashPassword(newPassword);
  await User.updateOne(
    { _id: userId },
    { $set: { password: hashed, updatedAt: new Date() } }
  );
};

/* ---------- Notification settings ---------- */
export const updateNotificationSettings = async (
  userId: string,
  updates: Partial<INotificationSettings>
) => {
  if (!Types.ObjectId.isValid(userId)) throw new Error('Invalid user ID');

  const user = await User.findById(userId).select('notificationSettings');
  if (!user) throw new Error('User not found');

  const current = user.notificationSettings || {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: true,
  };

  // Allow empty object → no changes
  if (!updates || Object.keys(updates).length === 0) {
    return await User.findById(userId).select(selectSafe);
  }

  const toSet: any = { updatedAt: new Date() };
  let hasChanges = false;

  const allowed = ['emailNotifications', 'pushNotifications', 'smsNotifications'] as const;

  for (const key of allowed) {
    if (key in updates && updates[key] !== current[key]) {
      toSet[`notificationSettings.${key}`] = updates[key];
      hasChanges = true;
    }
  }

  if (!hasChanges) {
    return await User.findById(userId).select(selectSafe);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: toSet },
    { new: true, runValidators: true }
  ).select(selectSafe);

  if (!updatedUser) throw new Error('Failed to update settings');
  return updatedUser;
};

/* ---------- Devices ---------- */
export const listDevices = async (userId: string) => {
  const user = await User.findById(userId).select('sessions');
  return (
    user?.sessions
      ?.filter((s: ISession) => s.active)      
      .map((s: ISession) => ({
        token: s.token,
        device: s.device ?? 'Unknown device',
        ipAddress: s.ipAddress ?? '',
        lastActive: s.lastActive.toISOString(),
        active: s.active,
      })) ?? []
  );
};

/** Permanently delete a session */
export const revokeDevice = async (userId: string, token: string) => {
  const result = await User.updateOne(
    { _id: userId },
    { $pull: { sessions: { token } } }  
  );

  if (result.modifiedCount === 0) {
    throw new Error('Session not found or already removed');
  }
};

/* ---------- Update Avatar ---------- */
export const updateAvatar = async (userId: string, fileBuffer: Buffer): Promise<string> => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('No file provided');
  }

  const user = await User.findById(userId).select('profile.avatar');
  if (!user) throw new Error('User not found');

  // Delete old avatar if exists and is from Cloudinary
  if (user.profile?.avatar) {
    const oldPublicId = extractPublicId(user.profile.avatar);
    if (oldPublicId) {
      try {
        await deleteFromCloudinary(oldPublicId);
      } catch (err) {
        console.warn('Failed to delete old avatar:', err);
        // Continue – don’t block user
      }
    }
  }

  // Upload new
  const { secure_url, public_id } = await uploadToCloudinary(fileBuffer, 'avatars');

  // Save URL only (public_id optional for future delete)
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        'profile.avatar': secure_url,
        updatedAt: new Date(),
      },
    }
  );

  return secure_url;
};

// helper: extract public_id from cloudinary URL
const extractPublicId = (url: string): string | null => {
  try {
    const parts = url.split('/');
    const versionIndex = parts.findIndex((p) => p.startsWith('v'));
    if (versionIndex === -1) return null;
    const publicIdWithExt = parts.slice(versionIndex + 1).join('/');
    return publicIdWithExt.split('.')[0]; // remove extension
  } catch {
    return null;
  }
};