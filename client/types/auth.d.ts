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

export type CertificationStatus = 'pending' | 'verified' | 'rejected';

/* ======================== HEALTHCARE TYPES ======================== */
export interface IHealthcareCertification {
  id: string;
  licenseNumber: string;
  licenseType: string; // 'RN', 'MD', 'NP', etc.
  issuingAuthority: string;
  issueDate: string; // ISO date
  expiryDate: string; // ISO date
  verificationStatus: CertificationStatus;
  verifiedBy?: string;
  verifiedAt?: string; // ISO date
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
  averageRating: number;
  totalRatings: number;
  totalTips: number;
  responseTime?: number; // in minutes
  acceptanceRate?: number; // percentage
  totalEarnings: number;
}

export interface IAvailabilitySlot {
  start: string; // "09:00"
  end: string;   // "17:00"
}

export interface IDailyAvailability {
  day: string; // 'monday', 'tuesday', etc.
  slots: IAvailabilitySlot[];
  available: boolean;
}

export interface IAvailability {
  isAvailable: boolean;
  schedule: IDailyAvailability[];
  emergencyAvailable: boolean;
  maxPatientsPerDay: number;
}

export interface IEducation {
  degree: string;
  institution: string;
  year: number;
}

export interface IHealthcareProfile {
  certifications: IHealthcareCertification[];
  specializations: IHealthcareSpecialization[];
  education: IEducation[];
  languages: string[];
  bio: string;
  hourlyRate?: number;
  stats: IProfessionalStats;
  availability: IAvailability;
  services: string[];
  hospitalAffiliation?: string;
  isOnline: boolean;
  isVerified?: boolean;
  lastActive: string; // ISO date
}

/* ======================== RATING & TIP TYPES ======================== */
export interface IRating {
  id: string;
  name?: string;
  userId: string;
  professionalId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string; // ISO date
  updatedAt?: string;
  appointmentId?: string;
}

export interface ITip {
  id: string;
  fromUserId: string;
  toProfessionalId: string;
  fromUserName: string;
  amount: number;
  message?: string;
  createdAt: string; // ISO date
  appointmentId?: string;
}

/* ======================== NESTED INTERFACES ======================== */
export interface ILocation {
  city?: string;
  state?: string;
  country?: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
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
  specialization?: string;
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
  appointmentReminders: boolean;
  securityAlerts: boolean;
  roleUpdates: boolean;
  promotional: boolean;
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
  healthcareProfile?: IHealthcareProfile;
  emergencyContact?: IEmergencyContact;

  notificationSettings?: INotificationSettings;
  sessions?: ISession[];

  favorites?: string[]; // ObjectId[] → string[] in frontend
  walletBalance: number;

  isVerified: boolean;
  verificationMethod: VerificationMethod;

  isDeleted: boolean;
  deletedAt?: string | null; // ISO date

  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

/* ======================== HEALTHCARE PROFESSIONAL TYPES ======================== */
export interface HealthcareProfessional {
  id: string;
  name: string;
  email: string;
  role: 'doctor' | 'nurse';
  profile?: IProfile;
  healthcareProfile: IHealthcareProfile;
  averageRating: number;
  totalRatings: number;
  isOnline: boolean;
  distance?: number;
  isVerified?: boolean;
  phoneNumber?: string;
}

export interface ProfessionalsFilter {
  role?: 'doctor' | 'nurse';
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  specialization?: string;
  minRating?: number;
  maxDistance?: number;
  latitude?: number;
  longitude?: number;
  availability?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'experience' | 'distance' | 'responseTime';
}

export interface ProfessionalsResponse {
  professionals: HealthcareProfessional[];
  total: number;
  page: number;
  limit: number;
  message?: string;
  searchLocation?: string;
  searchScope?: string;
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
  location?: ILocation;
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
  location?: ILocation;
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