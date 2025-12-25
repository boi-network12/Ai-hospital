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
  issuedCountry?: string;
  approvalDate?: string;
  adminNote?: string; 
}

// Add Tax Document Interface
export interface ITaxDocument {
  name: string;
  type: 'tax_id' | 'exemption_certificate' | 'business_registration' | 'treaty_form' | 'other';
  url: string;
  uploadedAt: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  expiryDate?: string;
  notes?: string;
}

// Add Tax Information Interface
export interface ITaxInfo {
  hasTaxInfo?: boolean;
  taxId?: string;
  taxIdType?: 'SSN' | 'EIN' | 'TIN' | 'VAT' | 'GST' | 'PAN' | 'NIF' | 'ABN' | 'CUIT' | 'other' | '';
  taxCountry?: string;
  taxState?: string;
  taxResidency?: string;
  taxRate?: number;
  isTaxExempt?: boolean;
  exemptionReason?: string;
  exemptionCertificateId?: string;
  businessName?: string;
  businessType?: 'individual' | 'sole_proprietorship' | 'llc' | 'corporation' | 'partnership' | 'non_profit' | '';
  businessRegistrationNumber?: string;
  taxFormPreference?: '1099' | 'W-9' | 'W-8BEN' | 'W-8ECI' | 'W-8IMY' | 'W-8EXP' | 'other' | '';
  taxTreatyBenefits?: boolean;
  treatyCountry?: string;
  treatyArticle?: string;
  annualEarningsThreshold?: number;
  taxWithholdingRate?: number;
  documents?: ITaxDocument[];
  verified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  lastVerified?: string;
  status?: 'pending' | 'verified' | 'rejected' | 'expired' | 'not_required';
  adminNotes?: string;
  lastTaxReportDate?: string | null;
  nextTaxReportDue?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IHealthcareStats {
  averageRating?: number;
  totalConsultations?: number;
  responseTime?: string;
}

export interface IHealthcareAvailability {
  isAvailable: boolean;
  // you can add schedule, working hours, etc. later
}

export interface IHealthcareProfile {
  stats?: IHealthcareStats;
  availability?: IHealthcareAvailability;
  languages?: string[]
  hourlyRate?: number;
  services?: string[];
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
  healthcareProfile?: IHealthcareProfile; 
  taxInfo?: ITaxInfo; // Add taxInfo here
  updatedAt: string;
  // Additional fields you might have
  walletBalance?: number;
  isOnline?: boolean;
  lastActive?: string;
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