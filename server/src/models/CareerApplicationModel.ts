import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types/usersDetails';

export interface ICareerApplication extends Document {
  // Personal Information
  email: string;
  phoneNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  
  // Role Application
  desiredRole: UserRole;
  specialization: string;
  yearsOfExperience: number;
  currentPosition?: string;
  currentEmployer?: string;
  
  // Documents
  resumeUrl: string;
  profilePictureUrl: string; // Passport copy
  licenseDocumentUrl?: string;
  certificates: Array<{
    name: string;
    url: string;
    issuedDate: Date;
    expiryDate?: Date;
    issuingAuthority?: string;
    licenseNumber?: string;
    licenseType?: string;
  }>;
  
  // Application Details
  coverLetter?: string;
  expectedSalary?: number;
  availableStartDate?: Date;
  preferredLocations: string[];
  willingToRelocate: boolean;
  
  // Status & Workflow
  status: 'pending' | 'under_review' | 'interview_scheduled' | 'approved' | 'rejected';
  interviewDate?: Date;
  interviewLink?: string; // Zoom/Google Meet link
  interviewNotes?: string;
  
  // Reviewer Information
  assignedAdmin?: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  
  // User Account (if created)
  createdUserId?: mongoose.Types.ObjectId;
  accountCreatedAt?: Date;
  
  // Timeline
  applicationDate: Date;
  lastUpdated: Date;
  
  // Rejection/Withdrawal
  rejectionReason?: string;
  withdrawnAt?: Date;
  notes?: string;
  
  // Metadata
  ipAddress?: string;
  source?: string; // How they found the application
  privacyConsent: boolean;
  termsAccepted: boolean;
}

const CareerApplicationSchema = new Schema<ICareerApplication>({
  // Personal Information
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  dateOfBirth: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    required: true,
  },
  nationality: {
    type: String,
    required: true,
  },
  
  // Role Application
  desiredRole: {
    type: String,
    enum: ['nurse', 'doctor', 'hospital'],
    required: true,
  },
  specialization: {
    type: String,
    required: true,
  },
  yearsOfExperience: {
    type: Number,
    required: true,
    min: 0,
  },
  currentPosition: {
    type: String,
  },
  currentEmployer: {
    type: String,
  },
  
  // Documents
  resumeUrl: {
    type: String,
    required: true,
  },
  profilePictureUrl: {
    type: String,
    required: true,
  },
  licenseDocumentUrl: {
    type: String,
  },
  certificates: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    issuedDate: { type: Date, required: true },
    expiryDate: { type: Date },
     issuingAuthority: { type: String },
    licenseNumber: { type: String },
    licenseType: { type: String },
  }],
  
  // Application Details
  coverLetter: {
    type: String,
  },
  expectedSalary: {
    type: Number,
  },
  availableStartDate: {
    type: Date,
  },
  preferredLocations: [{
    type: String,
  }],
  willingToRelocate: {
    type: Boolean,
    default: false,
  },
  
  // Status & Workflow
  status: {
    type: String,
    enum: ['pending', 'under_review', 'interview_scheduled', 'approved', 'rejected'],
    default: 'pending',
  },
  interviewDate: {
    type: Date,
  },
  interviewLink: {
    type: String,
  },
  interviewNotes: {
    type: String,
  },
  
  // Reviewer Information
  assignedAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  
  // User Account
  createdUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  accountCreatedAt: {
    type: Date,
  },
  
  // Timeline
  applicationDate: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  
  // Rejection/Withdrawal
  rejectionReason: {
    type: String,
  },
  withdrawnAt: {
    type: Date,
  },
  notes: {
    type: String,
  },
  
  // Metadata
  ipAddress: {
    type: String,
  },
  source: {
    type: String,
    enum: ['website', 'linkedin', 'job_board', 'referral', 'other'],
    default: 'website',
  },
  privacyConsent: {
    type: Boolean,
    required: true,
    default: false,
  },
  termsAccepted: {
    type: Boolean,
    required: true,
    default: false,
  },
});

// Indexes
CareerApplicationSchema.index({ email: 1 });
CareerApplicationSchema.index({ status: 1 });
CareerApplicationSchema.index({ desiredRole: 1 });
CareerApplicationSchema.index({ applicationDate: -1 });
CareerApplicationSchema.index({ assignedAdmin: 1 });
CareerApplicationSchema.index({ 'preferredLocations': 1 });
CareerApplicationSchema.index({ createdUserId: 1 });
CareerApplicationSchema.index({ status: 1, desiredRole: 1 });

// Update timestamp before saving
CareerApplicationSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

CareerApplicationSchema.pre('findOneAndUpdate', function(next) {
  this.set({ lastUpdated: new Date() });
  next();
});

export default mongoose.model<ICareerApplication>('CareerApplication', CareerApplicationSchema);