import { Request, Response } from 'express';
import * as adminService from '../services/adminService';
import * as notificationService from '../services/notificationService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { UserRole } from '../types/usersDetails';
import User from "../models/UserModel";

/* ---------- Create any user ---------- */
export const createUser = async (req: AuthRequest, res: Response) => {
  const {
    email,
    password,
    name,
    phoneNumber,
    role,
    gender,
    dateOfBirth,
    location,
    specialization,
    licenseNumber,
    issuedCountry,
  } = req.body;
  if (!email || !password || !name || !role || !location) {
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
      location,
      specialization,
      licenseNumber,
      issuedCountry,
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
    // Get old user data
    const oldUser = await User.findById(userId);
    if (!oldUser) throw new Error('User not found');

    const user = await adminService.adminUpdateUserRole(userId, role as UserRole);

    // Send role update notification to the user
    await notificationService.sendNotification({
      userId: userId,
      type: 'role_approval',
      title: 'Role Updated',
      message: `Your role has been changed from ${oldUser.role} to ${role} by an administrator.`,
      priority: 'high',
      actionUrl: '/profile',
      data: {
        oldRole: oldUser.role,
        newRole: role,
        updatedBy: req.user._id,
        updatedAt: new Date(),
      }
    });

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

    // Send restriction notification
    if (restrict) {
      await notificationService.sendNotification({
        userId: userId,
        type: 'security',
        title: 'Account Restricted',
        message: 'Your account has been restricted by an administrator. Some features may be unavailable.',
        priority: 'high',
        actionUrl: '/support',
        data: {
          restrictedAt: new Date(),
          restrictedBy: req.user._id,
        }
      });
    } else {
      await notificationService.sendNotification({
        userId: userId,
        type: 'security',
        title: 'Account Restriction Lifted',
        message: 'Your account restrictions have been lifted. All features are now available.',
        priority: 'medium',
        data: {
          unrestrictedAt: new Date(),
          unrestrictedBy: req.user._id,
        }
      });
    }

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

    // Send role approval/rejection notification
    if (approve) {
      await notificationService.sendNotification({
        userId: userId,
        type: 'role_approval',
        title: 'Role Request Approved',
        message: `Congratulations! Your request to become a ${user.role} has been approved.`,
        priority: 'high',
        actionUrl: '/profile',
        data: {
          role: user.role,
          approvedAt: new Date(),
          approvedBy: req.user._id,
        }
      });
    } else {
      await notificationService.sendNotification({
        userId: userId,
        type: 'role_approval',
        title: 'Role Request Rejected',
        message: `Your request to become a ${user.role} was rejected. ${adminNote ? `Reason: ${adminNote}` : ''}`,
        priority: 'medium',
        actionUrl: '/support',
        data: {
          role: user.role,
          rejectedAt: new Date(),
          rejectedBy: req.user._id,
          adminNote: adminNote,
        }
      });
    }

    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ---------- Update healthcare certifications ---------- */
export const updateHealthcareCertifications = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { certifications } = req.body;

  try {
    const user = await adminService.adminUpdateHealthcareCertifications(userId, certifications);

    await notificationService.sendNotification({
      userId: userId,
      type: 'certification_update',
      title: 'Certifications Updated',
      message: 'Your professional certifications have been updated by an administrator.',
      priority: 'medium',
      actionUrl: '/profile/certifications',
      data: {
        updatedBy: req.user._id,
        updatedAt: new Date(),
      }
    });

    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ---------- Verify certification ---------- */
export const verifyCertification = async (req: AuthRequest, res: Response) => {
  const { userId, certificationId } = req.params;
  const { status, notes } = req.body;

  try {
    const user = await adminService.adminVerifyCertification(
      userId,
      certificationId,
      status,
      notes,
      req.user._id
    );

    const statusMessage = status === 'verified' ? 'approved' : 'rejected';

    await notificationService.sendNotification({
      userId: userId,
      type: 'certification_verification',
      title: `Certification ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}`,
      message: `Your certification has been ${statusMessage}. ${notes ? `Notes: ${notes}` : ''}`,
      priority: 'high',
      actionUrl: '/profile/certifications',
      data: {
        certificationId,
        status,
        verifiedBy: req.user._id,
        verifiedAt: new Date(),
        notes
      }
    });

    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ---------- Update professional details ---------- */
export const updateProfessionalDetails = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { specializations, availability, services, hourlyRate, bio } = req.body;

  try {
    const user = await adminService.adminUpdateProfessionalDetails(userId, {
      specializations,
      availability,
      services,
      hourlyRate,
      bio
    });

    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/** --------- update user profile -------------------- */

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const updates = req.body;

  // Prevent updating these fields via this endpoint
  const disallowedFields = ['password', 'avatar', 'sessions', 'passwordResetOtp', 'passwordResetOtpExpires', '_id', 'email'];
  for (const field of disallowedFields) {
    if (updates[field] !== undefined) {
      return res.status(400).json({ message: `Cannot update ${field} via this endpoint` });
    }
  }

  try {
    // Find user first
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Apply updates deeply (supports nested objects)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password -sessions.token -passwordResetOtp -passwordResetOtpExpires');

    // Send notification about profile update
    await notificationService.sendNotification({
      userId,
      type: 'profile_update',
      title: 'Profile Updated by Admin',
      message: 'An administrator has updated your profile. You can now log in with your credentials.',
      priority: 'high',
      actionUrl: '/login',
      data: {
        updatedBy: req.user._id,
        updatedAt: new Date(),
        changes: Object.keys(updates),
      },
    });

    // Optional: Send email with login credentials if email/password were just set
    if (updates.email || updates.tempPassword) {
      // You can send email here using your email service
      // e.g., sendWelcomeEmail(user.email, updates.tempPassword || 'their password')
    }

    res.json(updatedUser);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ---------- Update tax information ---------- */
export const updateTaxInfo = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const taxInfoData = req.body;

  try {
    const user = await adminService.adminUpdateTaxInfo(userId, taxInfoData);

    // Send notification
    await notificationService.sendNotification({
      userId: userId,
      type: 'tax_update',
      title: 'Tax Information Updated',
      message: 'Your tax information has been updated by an administrator.',
      priority: 'medium',
      actionUrl: '/profile/tax',
      data: {
        updatedBy: req.user._id,
        updatedAt: new Date(),
        fieldsUpdated: Object.keys(taxInfoData)
      }
    });

    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ---------- Upload tax document ---------- */
export const uploadTaxDocument = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const documentData = req.body;

  try {
    const user = await adminService.adminUploadTaxDocument(userId, documentData);

    await notificationService.sendNotification({
      userId: userId,
      type: 'tax_document',
      title: 'Tax Document Uploaded',
      message: `A tax document (${documentData.name}) has been uploaded to your account by an administrator.`,
      priority: 'medium',
      actionUrl: '/profile/tax/documents',
      data: {
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
        documentName: documentData.name,
        documentType: documentData.type
      }
    });

    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ---------- Delete tax document ---------- */
export const deleteTaxDocument = async (req: AuthRequest, res: Response) => {
  const { userId, docId } = req.params;

  try {
    const user = await adminService.adminDeleteTaxDocument(userId, docId);

    await notificationService.sendNotification({
      userId: userId,
      type: 'tax_document',
      title: 'Tax Document Removed',
      message: 'A tax document has been removed from your account by an administrator.',
      priority: 'medium',
      actionUrl: '/profile/tax/documents',
      data: {
        removedBy: req.user._id,
        removedAt: new Date(),
        documentId: docId
      }
    });

    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ---------- Verify tax information ---------- */
export const verifyTaxInfo = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { verified, status, adminNotes } = req.body;

  try {
    const user = await adminService.adminVerifyTaxInfo(userId, {
      verified,
      status,
      adminNotes,
      verifiedBy: req.user._id
    });

    const statusMessages: Record<string, string> = {
      'verified': 'approved',
      'rejected': 'rejected',
      'pending': 'marked as pending',
      'expired': 'marked as expired',
      'not_required': 'marked as not required'
    };

    await notificationService.sendNotification({
      userId: userId,
      type: 'tax_verification',
      title: `Tax Information ${statusMessages[status]}`,
      message: `Your tax information has been ${statusMessages[status]}. ${adminNotes ? `Notes: ${adminNotes}` : ''}`,
      priority: verified ? 'high' : 'medium',
      actionUrl: '/profile/tax',
      data: {
        verified,
        status,
        verifiedBy: req.user._id,
        verifiedAt: new Date(),
        adminNotes
      }
    });

    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ---------- Get tax information ---------- */
export const getTaxInfo = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  try {
    const taxInfo = await adminService.adminGetTaxInfo(userId);
    res.json(taxInfo);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ---------- Remove tax information ---------- */
export const removeTaxInfo = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  try {
    const result = await adminService.adminRemoveTaxInfo(userId);

    await notificationService.sendNotification({
      userId: userId,
      type: 'tax_removal',
      title: 'Tax Information Removed',
      message: 'Your tax information has been removed by an administrator.',
      priority: 'medium',
      data: {
        removedBy: req.user._id,
        removedAt: new Date()
      }
    });

    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};