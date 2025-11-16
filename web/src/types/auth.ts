export type UserRole =
  | 'user'
  | 'nurse'
  | 'doctor'
  | 'hospital'
  | 'admin'
  | 'ai';

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
  dateOfBirth?: string | null;
  gender?: Gender;
  bloodGroup?: string;
  genotype?: string;
  height?: number;
  weight?: number;
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
  lastActive: string;
  active: boolean;
}
export interface IRoleStatus {
  isActive: boolean;
  approvedByAdmin?: boolean;
  verifiedLicense?: boolean;
  licenseNumber?: string;
  approvalDate?: string;
}
export interface User {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  role: UserRole;
  roleStatus?: IRoleStatus;
  profile?: IProfile;
  emergencyContact?: IEmergencyContact;
  notificationSettings?: INotificationSettings;
  sessions?: ISession[];
  favorites?: string[];
  isVerified: boolean;
  verificationMethod: VerificationMethod;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AuthState = {
  isReady: boolean;
  isAuth: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
};

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  gender?: Gender;
  dateOfBirth?: string;
};
export type OtpPayload = { email: string };
export type VerifyOtpPayload = { email: string; otp: string };