import { Document, Types } from 'mongoose';

export type UserRole = 'user' | 'nurse' | 'doctor' | 'hospital' | 'admin' | 'ai';
export type VerificationMethod = 'email' | 'manual';
export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export interface ILocation {
  city?: string;
  state?: string;
  country?: string;
}

export interface IProfile {
  avatar?: string;
  location?: ILocation;
  dateOfBirth?: Date | null;
  gender?: Gender;
  bloodGroup?: string;
  genotype?: string;
  height?: number;
  weight?: number;
  specialization?: string; // for doctors/nurses
  department?: string; // for hospitals
  bio?: string;
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
}

export interface INotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

export interface ISession {
  token: string;
  device?: string;
  ipAddress?: string;
  lastActive: Date;
  active: boolean;
}

export interface IRoleStatus {
  isActive: boolean; // whether they’re currently available / visible
  approvedByAdmin?: boolean;
  verifiedLicense?: boolean;
  licenseNumber?: string;
  approvalDate?: Date | null;
}

export interface IUserLean {
  _id: Types.ObjectId;
  email: string;
  name: string;
  phoneNumber?: string;
  role: UserRole;
  roleStatus?: IRoleStatus;
  profile?: IProfile;
  isVerified: boolean;
  verificationMethod: VerificationMethod;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;

  role: UserRole;
  roleStatus?: IRoleStatus;

  profile?: IProfile;
  emergencyContact?: IEmergencyContact;

  notificationSettings?: INotificationSettings;
  sessions?: ISession[];

  favorites?: Types.ObjectId[]; // array of provider IDs (doctor, nurse, hospital)

  isVerified: boolean;
  verificationMethod: VerificationMethod;

  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminAnalytics {
  totalUsers: number;
  usersByRole: Record<UserRole, number>;
  verifiedUsers: number;
  pendingRoleRequests: number;
  activeSessions: number;
}