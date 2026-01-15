import { Request, Response } from 'express';
import * as adminService from '../services/adminService';
import * as notificationService from '../services/notificationService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { UserRole } from '../types/usersDetails';
import User from "../models/UserModel";
import Log from "../models/LogModel"
import { sendMail } from '../utils/mailer';

const getUserId = (userId: string | string[]): string => {
  if (Array.isArray(userId)) {
    return userId[0];
  }
  return userId;
};

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
  const userIdStr = getUserId(userId);
  const { role } = req.body;
  if (!role) return res.status(400).json({ message: 'role required' });
  try {
    // Get old user data
    const oldUser = await User.findById(userId);
    if (!oldUser) throw new Error('User not found');

    const user = await adminService.adminUpdateUserRole(userIdStr, role as UserRole);

    // Send role update notification to the user
    await notificationService.sendNotification({
      userId: userIdStr,
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
  const userIdStr = getUserId(userId);
  const { restrict } = req.body;
  if (typeof restrict !== 'boolean') return res.status(400).json({ message: 'restrict boolean required' });

  try {
    const user = await adminService.adminToggleRestrict(userIdStr, restrict);

    // Send restriction notification
    if (restrict) {
      await notificationService.sendNotification({
        userId: userIdStr,
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
        userId: userIdStr,
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
  const userIdStr = getUserId(userId);
  try {
    const result = await adminService.adminDeleteUser(userIdStr);
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
  const userIdStr = getUserId(userId);
  try {
    const user = await adminService.adminGetUserProfile(userIdStr);
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
  const userIdStr = getUserId(userId);
  const { approve, adminNote } = req.body;
  if (typeof approve !== 'boolean') return res.status(400).json({ message: 'approve boolean required' });

  try {
    const user = await adminService.adminHandleRoleRequest(userIdStr, approve, adminNote);

    // Send role approval/rejection notification
    if (approve) {
      await notificationService.sendNotification({
        userId: userIdStr,
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
        userId: userIdStr,
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
  const userIdStr = getUserId(userId);
  const { certifications } = req.body;

  try {
    const user = await adminService.adminUpdateHealthcareCertifications(userIdStr, certifications);

    await notificationService.sendNotification({
      userId: userIdStr,
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
  const userIdStr = getUserId(userId);
  const certificationIdStr = getUserId(certificationId);
  const { status, notes } = req.body;

  try {
    const user = await adminService.adminVerifyCertification(
      userIdStr,
      certificationIdStr,
      status,
      notes,
      req.user._id
    );

    const statusMessage = status === 'verified' ? 'approved' : 'rejected';

    await notificationService.sendNotification({
      userId: userIdStr,
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
  const userIdStr = getUserId(userId);
  const { specializations, availability, services, hourlyRate, bio } = req.body;

  try {
    const user = await adminService.adminUpdateProfessionalDetails(userIdStr, {
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
  const userIdStr = getUserId(userId);
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
      userIdStr,
      { $set: updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password -sessions.token -passwordResetOtp -passwordResetOtpExpires');

    // Send notification about profile update
    await notificationService.sendNotification({
      userId: userIdStr,
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
  const userIdStr = getUserId(userId);
  const taxInfoData = req.body;

  try {
    const user = await adminService.adminUpdateTaxInfo(userIdStr, taxInfoData);

    // Send notification
    await notificationService.sendNotification({
      userId: userIdStr,
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
  const userIdStr = getUserId(userId);
  const documentData = req.body;

  try {
    const user = await adminService.adminUploadTaxDocument(userIdStr, documentData);

    await notificationService.sendNotification({
      userId: userIdStr,
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
  const docIdStr = getUserId(docId);
  const userIdStr = getUserId(userId);

  try {
    const user = await adminService.adminDeleteTaxDocument(userIdStr, docIdStr);

    await notificationService.sendNotification({
      userId: userIdStr,
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
  const userIdStr = getUserId(userId);
  const { verified, status, adminNotes } = req.body;

  try {
    const user = await adminService.adminVerifyTaxInfo(userIdStr, {
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
      userId: userIdStr,
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
  const userIdStr = getUserId(userId);

  try {
    const taxInfo = await adminService.adminGetTaxInfo(userIdStr);
    res.json(taxInfo);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
};

/* ---------- Remove tax information ---------- */
export const removeTaxInfo = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const userIdStr = getUserId(userId);

  try {
    const result = await adminService.adminRemoveTaxInfo(userIdStr);

    await notificationService.sendNotification({
      userId: userIdStr,
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

/* ---------- Send Compliance Reminder ---------- */
export const sendComplianceReminder = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const userIdStr = getUserId(userId);
  const { reminderType, customMessage } = req.body;

  if (!reminderType) {
    return res.status(400).json({ message: 'Valid reminder type is required (tax, license, or both)' });
  }

  try {
    // Get user
    const user = await User.findById(userId).select('name email role roleStatus');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let subject = '';
    let htmlContent = '';
    const baseUrl = '#'; // Change to your actual app URL
    const profileUrl = `${baseUrl}/profile/settings`;
    const taxUrl = `${baseUrl}/profile/tax`;
    const licenseUrl = `${baseUrl}/profile/certifications`;

    const headerColor = reminderType === 'tax' ? '#dc2626' : reminderType === 'license' ? '#d97706' : '#7c3aed';
    const alertBg = reminderType === 'tax' ? '#fef2f2' : reminderType === 'license' ? '#fffbeb' : '#f5f3ff';
    const alertBorder = reminderType === 'tax' ? '#dc2626' : reminderType === 'license' ? '#d97706' : '#7c3aed';

    switch (reminderType) {
      case 'tax':
        subject = 'Action Required: Submit Your Tax Information';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
            <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
              <h2 style="color: ${headerColor}; font-size: 24px; margin-bottom: 20px; font-weight: bold;">
                Tax Information Missing
              </h2>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Dear ${user.name},
              </p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                We noticed that your <strong>tax information</strong> is either missing or incomplete in your account.
              </p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                This information is required to process any payments you earn on our platform.
              </p>

              <div style="background: ${alertBg}; padding: 20px; border-left: 5px solid ${alertBorder}; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #1f2937;">
                  Please provide the following:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
                  <li>Tax Identification Number (SSN, EIN, TIN, VAT, etc.)</li>
                  <li>Country of tax residency</li>
                  <li>Tax form preference (e.g., W-9, W-8BEN)</li>
                  <li>Business details (if applicable)</li>
                </ul>
                <p style="margin: 16px 0 0 0; font-size: 15px; color: #991b1b;">
                  <strong>Warning:</strong> Without complete tax information, payments will be delayed or withheld.
                </p>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${taxUrl}" style="display: inline-block; background: #2563eb; color: white; font-weight: bold; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">
                  Update Tax Information Now
                </a>
              </div>
        `;
        break;

      case 'license':
        subject = 'Action Required: Submit Your Professional License';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
            <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
              <h2 style="color: ${headerColor}; font-size: 24px; margin-bottom: 20px; font-weight: bold;">
                Professional License Required
              </h2>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Dear ${user.name},
              </p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Your professional license information is missing or has not been verified yet.
              </p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                This is required to continue offering services on our platform and to comply with healthcare regulations.
              </p>

              <div style="background: ${alertBg}; padding: 20px; border-left: 5px solid ${alertBorder}; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #1f2937;">
                  Please upload the following documents:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.8;">
                  <li>Active Professional License / Certificate</li>
                  <li>License Number and Issuing Authority</li>
                  <li>Government-issued Photo ID</li>
                  <li>Proof of Good Standing (if applicable)</li>
                  <li>Specialization Certificates (optional but recommended)</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${licenseUrl}" style="display: inline-block; background: #2563eb; color: white; font-weight: bold; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">
                  Upload License Documents
                </a>
              </div>
        `;
        break;

      case 'both':
        subject = 'Urgent: Complete Your Tax & License Information';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
            <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
              <h2 style="color: ${headerColor}; font-size: 24px; margin-bottom: 20px; font-weight: bold;">
                Important: Missing Tax & License Information
              </h2>
              <p style="font-size: 16px; color: #374151; line-height: 1.6;">
                Dear ${user.name},
              </p>
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 20px;">
                Our records show that <strong>both your tax information and professional license</strong> are missing or incomplete.
              </p>

              <div style="background: ${alertBg}; padding: 20px; border-left: 5px solid ${alertBorder}; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0 0 16px 0; font-weight: bold; color: #1f2937;">
                  You need to complete the following:
                </p>
                <div style="margin-bottom: 20px;">
                  <p style="font-weight: bold; margin: 12px 0 8px 0;">📄 Tax Information</p>
                  <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.7;">
                    <li>Tax ID (SSN, EIN, TIN, etc.)</li>
                    <li>Tax residency country</li>
                    <li>Preferred tax form (W-9, W-8BEN, etc.)</li>
                  </ul>
                </div>
                <div>
                  <p style="font-weight: bold; margin: 12px 0 8px 0;">🎓 Professional License</p>
                  <ul style="margin: 0; padding-left: 20px; color: #4b5563; line-height: 1.7;">
                    <li>Active license/certificate</li>
                    <li>License number & issuing authority</li>
                    <li>Government ID</li>
                    <li>Proof of good standing</li>
                  </ul>
                </div>
                <p style="margin: 20px 0 0 0; font-weight: bold; color: #7c3aed;">
                  Until both are completed, you may not receive payments and your account may be restricted.
                </p>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${profileUrl}" style="display: inline-block; background: #7c3aed; color: white; font-weight: bold; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px;">
                  Complete Profile Now
                </a>
              </div>
        `;
        break;
    }

    // Add custom admin message
    if (customMessage) {
      htmlContent += `
        <div style="background: #f3f4f6; padding: 18px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">Note from Administrator:</p>
          <p style="margin: 0; color: #4b5563; line-height: 1.6;">${customMessage.replace(/\n/g, '<br>')}</p>
        </div>
      `;
    }

    // Footer
    htmlContent += `
              <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                  If you've already submitted this information, please ignore this email.<br>
                  This is required to keep your account active and eligible for payments.
                </p>
                <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
                  Thank you,<br>
                  <strong>The NeuroMed Healthcare Team</strong><br>
                  support@neuromed.app
                </p>
              </div>
            </div>
          </div>
        </div>
    `;

    // Send email
    try {
      await sendMail(user.email, subject, htmlContent);
    } catch (emailError: any) {
      console.error('Failed to send compliance email:', emailError);
      // Continue even if email fails
    }

    // Log action
    await Log.create({
      userId: user._id,
      action: 'compliance_reminder_sent',
      details: {
        reminderType,
        customMessage: customMessage || null,
        sentAt: new Date(),
        userRole: user.role,
      },
      performedBy: req.user._id
    });

    // In-app notification
    await notificationService.sendNotification({
      userId: userIdStr,
      type: 'compliance_reminder',
      title: subject,
      message: `You have a compliance reminder. ${customMessage ? 'Check your email for details.' : 'Please update your profile soon.'}`,
      priority: 'high',
      actionUrl: '/profile/settings',
      data: {
        reminderType,
        sentAt: new Date(),
        adminId: req.user._id,
        requiresAction: true
      }
    });

    res.json({
      success: true,
      message: 'Compliance reminder sent successfully',
      details: { userId, email: user.email, reminderType }
    });

  } catch (error: any) {
    console.error('Error sending compliance reminder:', error);
    res.status(500).json({ message: 'Failed to send reminder', error: error.message });
  }
};