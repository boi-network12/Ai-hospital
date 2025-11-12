// src/types/auth.ts
// ---------------------------------------------------------------------
//  Frontend types that 1-to-1 match the backend Mongoose IUser model
// ---------------------------------------------------------------------

/* ======================== ENUM-LIKE TYPES ======================== */
export type UserRole =
  | 'user'
  | 'nurse'
  | 'doctor'
  | 'hospital'
  | 'admin'
  | 'ai';

export type VerificationMethod = 'email' | 'manual';

export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

/* ======================== NESTED INTERFACES ======================== */
export interface ILocation {
  city?: string;
  state?: string;
  country?: string;
}

export interface IProfile {
  avatar?: string;
  location?: ILocation;
  dateOfBirth?: string | null; // ISO string from backend
  gender?: Gender;
  bloodGroup?: string;
  genotype?: string;
  height?: number; // cm
  weight?: number; // kg
  specialization?: string;
  department?: string;
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
  lastActive: string; // ISO date
  active: boolean;
}

export interface IRoleStatus {
  isActive: boolean;
  approvedByAdmin?: boolean;
  verifiedLicense?: boolean;
  licenseNumber?: string;
  approvalDate?: string; // ISO date
}

/* ======================== MAIN USER TYPE ======================== */
export interface User {
  id: string; // _id from MongoDB
  email: string;
  name: string;
  phoneNumber?: string;

  role: UserRole;
  roleStatus?: IRoleStatus;

  profile?: IProfile;
  emergencyContact?: IEmergencyContact;

  notificationSettings?: INotificationSettings;
  sessions?: ISession[];

  favorites?: string[]; // ObjectId[] → string[] in frontend

  isVerified: boolean;
  verificationMethod: VerificationMethod;

  isDeleted: boolean;
  deletedAt?: string | null; // ISO date

  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

/* ======================== AUTH STATE ======================== */
export type AuthState = {
  isReady: boolean;
  isAuth: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
};

/* ======================== PAYLOADS ======================== */
export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  gender?: Gender;
  dateOfBirth?: string; // ISO string
};

export type OtpPayload = {
  email: string;
};

export type VerifyOtpPayload = {
  email: string;
  otp: string;
  password?: string;
  name?: string;
  phoneNumber?: string;
  gender?: Gender;
  dateOfBirth?: string;
};

/* ======================== API RESPONSES ======================== */
export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type RefreshTokenResponse = {
  accessToken: string;
};

export type DeviceSession = Pick<ISession, 'device' | 'ipAddress' | 'lastActive' | 'active'>;

/* ======================== CONTEXT HELPERS ======================== */
export type UserContextType = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};