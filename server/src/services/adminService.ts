import User, { } from '../models/UserModel';
import { hashPassword } from './authService';
import { IAdminAnalytics, IHealthcareCertification, IHealthcareProfile, IUserLean, UserRole } from '../types/usersDetails';
import { Types } from 'mongoose';
import { sendMail } from '../utils/mailer';
import { sendUserCreationEmail } from '../utils/emailUserCreation';

/* ---------- Helpers ---------- */
const safeSelect = '-password -sessions.token';

/* ---------- Register any user (admin only) ---------- */
export const adminCreateUser = async (data: {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  role: UserRole;
  gender?: string;
  dateOfBirth?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  specialization?: string;
  licenseNumber?: string;
  issuedCountry?: string;
}) => {
  const exists = await User.findOne({ email: data.email });
  if (exists) throw new Error('Email already registered');

  const user = new User({
    email: data.email.toLowerCase().trim(),
    password: await hashPassword(data.password),
    name: data.name.trim(),
    phoneNumber: data.phoneNumber ?? '',
    role: data.role,
    isVerified: true,
    verificationMethod: 'manual',
    profile: {
      gender: data.gender ?? 'Prefer not to say',
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      specialization: data.specialization ?? '',
      location: {
        city: data.location?.city ?? '',
        state: data.location?.state ?? '',
        country: data.location?.country ?? '',
      },
    },
    roleStatus: {
      isActive: true,
      approvedByAdmin: true,
      approvalDate: new Date(),
      verifiedLicense: true,
      licenseNumber: data.licenseNumber ?? '',
      issuedCountry: data.issuedCountry ?? '',
    },
  });


  await user.save();

  //  store plaintext password temporarily for email
  const plaintextPassword = data.password;

  const savedUser = await User.findById(user._id).select(safeSelect);
  if (!savedUser) throw new Error('Failed to retrieve created user');

  try {
    await sendUserCreationEmail(
      data.email,
      data.name,
      data.role,
      plaintextPassword,
    )
  } catch (error) {
    console.error('Failed to send welcome email: ', error)
  }
  return savedUser;
};

/* ---------- Update any user role (admin only) ---------- */
export const adminUpdateUserRole = async (
  userId: string,
  newRole: UserRole,
) => {
  const updateObj: any = {
    role: newRole,
    'roleStatus.approvedByAdmin': true,
    'roleStatus.approvalDate': new Date(),
    'roleStatus.isActive': true,
  };

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: updateObj },
    { new: true, runValidators: true }
  ).select(safeSelect);

  if (!updated) throw new Error('User not found');
  return updated;
};

/* ---------- Restrict / Un-restrict user ---------- */
export const adminToggleRestrict = async (userId: string, restrict: boolean) => {
  const updated = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        'roleStatus.isActive': !restrict,
        updatedAt: new Date(),
      },
    },
    { new: true }
  ).select(safeSelect);

  if (!updated) throw new Error('User not found');
  return updated;
};

/* ---------- Hard delete user ---------- */
export const adminDeleteUser = async (userId: string) => {
  const deleted = await User.findByIdAndDelete(userId);
  if (!deleted) throw new Error('User not found');
  return { message: 'User permanently deleted' };
};

/* ---------- List all users (filterable) ---------- */

/* ---------- List all users (filterable) ---------- */
export const adminListUsers = async (filters: {
  role?: UserRole;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  users: Array<Omit<IUserLean, '_id'> & { id: string }>;
  total: number;
  page: number;
  limit: number;
}> => {
  const { role, search, page = 1, limit = 20 } = filters;
  const query: any = { isDeleted: false };

  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];
  }

  const users = await User.find(query)
    .select(safeSelect)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean<IUserLean[]>() // Now correctly typed
    .exec();

  const serializedUsers = users.map((user) => ({
    ...user,
    id: user._id.toString(), // Now safe: _id is Types.ObjectId
    _id: undefined, // remove _id from response
  }));

  const total = await User.countDocuments(query);
  return { users: serializedUsers, total, page, limit };
};


/* ---------- Get any user profile (admin) ---------- */
export const adminGetUserProfile = async (userId: string) => {
  const user = await User.findById(userId).select(safeSelect);
  if (!user) throw new Error('User not found');
  return user;
};

/* ---------- Analytics dashboard ---------- */
export const adminAnalytics = async (): Promise<IAdminAnalytics> => {
  const agg = await User.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
      },
    },
  ]);

  const roleMap = agg.reduce((acc, cur) => {
    acc[cur._id as UserRole] = cur.count;
    return acc;
  }, {} as Record<UserRole, number>);

  const totalUsers = await User.countDocuments({ isDeleted: false });
  const verifiedUsers = await User.countDocuments({ isDeleted: false, isVerified: true });
  const pending = await User.countDocuments({
    isDeleted: false,
    role: { $in: ['doctor', 'nurse', 'hospital'] },
    'roleStatus.approvedByAdmin': false,
  });
  const activeSessions = await User.aggregate([
    { $match: { isDeleted: false } },
    { $unwind: '$sessions' },
    { $match: { 'sessions.active': true } },
    { $count: 'active' },
  ]);

  return {
    totalUsers,
    usersByRole: roleMap,
    verifiedUsers,
    pendingRoleRequests: pending,
    activeSessions: activeSessions[0]?.active ?? 0,
  };
};

/* ---------- Approve / Reject role request (doctor, nurse, hospital) ---------- */
export const adminHandleRoleRequest = async (
  userId: string,
  approve: boolean,
  adminNote?: string
) => {
  const setObj: any = {
    'roleStatus.approvedByAdmin': approve,
    'roleStatus.approvalDate': approve ? new Date() : null,
    updatedAt: new Date(),
  };
  if (!approve && adminNote) setObj['roleStatus.adminNote'] = adminNote;

  const updated = await User.findByIdAndUpdate(userId, { $set: setObj }, { new: true }).select(
    safeSelect
  );
  if (!updated) throw new Error('User not found');

  // ---- send email (you will create the mailer util) ----
  const subject = approve ? 'Role Request Approved' : 'Role Request Rejected';
  const html = approve
    ? `<p>Congratulations! Your request to become a <strong>${updated.role}</strong> has been approved.</p>`
    : `<p>Sorry, your request to become a <strong>${updated.role}</strong> was rejected.</p>
       ${adminNote ? `<p>Admin note: ${adminNote}</p>` : ''}`;

  await sendMail(updated.email, subject, html);
  return updated;
};

/* ---------- Update healthcare certifications ---------- */
export const adminUpdateHealthcareCertifications = async (
  userId: string,
  certifications: IHealthcareCertification[]
) => {
  const updated = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        'healthcareProfile.certifications': certifications,
        updatedAt: new Date()
      }
    },
    { new: true, runValidators: true }
  ).select(safeSelect);

  if (!updated) throw new Error('User not found');
  return updated;
};

/* ---------- Verify certification ---------- */
export const adminVerifyCertification = async (
  userId: string,
  certificationId: string,
  status: 'verified' | 'rejected',
  notes: string,
  verifiedBy: string
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Find the certification by ID in the array
  const certificationIndex = user.healthcareProfile?.certifications.findIndex(
    cert => cert._id?.toString() === certificationId
  );

  if (certificationIndex === -1 || certificationIndex === undefined) {
    throw new Error('Certification not found');
  }

  // Update the certification
  if (user.healthcareProfile?.certifications[certificationIndex]) {
    user.healthcareProfile.certifications[certificationIndex].verificationStatus = status;
    user.healthcareProfile.certifications[certificationIndex].verifiedBy = new Types.ObjectId(verifiedBy);
    user.healthcareProfile.certifications[certificationIndex].verifiedAt = new Date();
    if (notes) user.healthcareProfile.certifications[certificationIndex].notes = notes;
  }

  await user.save();
  return await User.findById(userId).select(safeSelect);
};

/* ---------- Update professional details ---------- */
export const adminUpdateProfessionalDetails = async (
  userId: string,
  data: Partial<IHealthcareProfile>
) => {
  const updateObj: any = {};

  Object.keys(data).forEach(key => {
    if (data[key as keyof IHealthcareProfile] !== undefined) {
      updateObj[`healthcareProfile.${key}`] = data[key as keyof IHealthcareProfile];
    }
  });

  updateObj.updatedAt = new Date();

  const updated = await User.findByIdAndUpdate(
    userId,
    { $set: updateObj },
    { new: true, runValidators: true }
  ).select(safeSelect);

  if (!updated) throw new Error('User not found');
  return updated;
};