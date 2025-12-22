import { Document, Types } from 'mongoose';

export type UserRole = 'user' | 'nurse' | 'doctor' | 'hospital' | 'admin' | 'ai';
export type VerificationMethod = 'email' | 'manual';
export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export interface ILocation {
  city?: string;
  state?: string;
  country?: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number];
  };
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

export interface IHealthcareCertification {
  _id?: Types.ObjectId,
  licenseNumber: string;
  licenseType: string; // 'RN', 'MD', 'NP', etc.
  issuingAuthority: string;
  issueDate: Date;
  expiryDate: Date;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  documentUrl?: string;
  notes?: string;
}

export interface IHealthcareSpecialization {
  name: string;
  yearsOfExperience: number;
  boardCertified: boolean;
  certificationNumber?: string;
}

export interface IProfessionalStats {
  totalConsultations: number;
  totalCompletedConsultations: number;
  averageRating: number;
  totalRatings: number;
  totalTips: number;
  responseTime?: number; // in minutes
  acceptanceRate?: number; // percentage
}

export interface IAvailability {
  isAvailable: boolean;
  schedule: {
    day: string; // 'monday', 'tuesday', etc.
    slots: {
      start: string;
      end: string;
    }[];
  }[];
  emergencyAvailable: boolean;
  maxPatientsPerDay: number;
}

export interface IHealthcareProfile {
  certifications: IHealthcareCertification[];
  specializations: IHealthcareSpecialization[];
  education: {
    degree: string;
    institution: string;
    year: number;
  }[];
  languages: string[];
  bio: string;
  hourlyRate?: number;
  stats: IProfessionalStats;
  availability: IAvailability;
  services: string[];
  hospitalAffiliation?: string;
}

export interface INotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  appointmentReminders: boolean;
  securityAlerts: boolean;
  roleUpdates: boolean;
  promotional: boolean;
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
  issuedCountry?: string;
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

  favorites?: Types.ObjectId[];

  passwordResetOtp?: string;
  passwordResetOtpExpires?: Date;

  isVerified: boolean;
  verificationMethod: VerificationMethod;

  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // health
  healthcareProfile?: IHealthcareProfile;
  walletBalance: number;
  isOnline: boolean;
  lastActive: Date;
}



export interface IRating {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  professionalId: Types.ObjectId;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
  updatedAt?: Date;
  appointmentId?: Types.ObjectId;
}

export interface ITip {
  _id: Types.ObjectId;
  fromUserId: Types.ObjectId;
  toProfessionalId: Types.ObjectId;
  amount: number;
  message?: string;
  createdAt: Date;
  appointmentId?: Types.ObjectId;
}

export interface IAdminAnalytics {
  totalUsers: number;
  usersByRole: Record<UserRole, number>;
  verifiedUsers: number;
  pendingRoleRequests: number;
  activeSessions: number;
}