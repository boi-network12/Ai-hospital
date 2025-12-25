import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/usersDetails';

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['user', 'nurse', 'doctor', 'hospital', 'admin', 'ai'],
    default: 'user',
  },
  roleStatus: {
    isActive: { type: Boolean, default: false },
    approvedByAdmin: { type: Boolean, default: false },
    verifiedLicense: { type: Boolean, default: false },
    licenseNumber: { type: String, default: '' },
    issuedCountry: { type: String, default: '' },
    approvalDate: { type: Date, default: null },
  },
  profile: {
    avatar: { type: String, default: '' },
    location: {
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          default: [0, 0]
        }
      }
    },
    dateOfBirth: { type: Date, default: null },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
      default: 'Prefer not to say',
    },
    bloodGroup: { type: String, default: '' },
    genotype: { type: String, default: '' },
    height: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    specialization: { type: String, default: '' },
    department: { type: String, default: '' },
    bio: { type: String, default: '' },
  },
  emergencyContact: {
    name: { type: String, default: '' },
    relationship: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
  },
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: true },
  },
  sessions: [
    {
      token: { type: String, required: true },
      device: { type: String, default: 'unknown' },
      ipAddress: { type: String, default: '' },
      lastActive: { type: Date, default: Date.now },
      active: { type: Boolean, default: true },
    },
  ],
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // references doctors/nurses/hospitals
    },
  ],
  healthcareProfile: {
    bio: { type: String, default: '' },
    hourlyRate: { type: Number, default: 0 },
    services: [{ type: String }],
    languages: [{ type: String }],
    availability: {
      isAvailable: { type: Boolean, default: true },
      schedule: [{
        day: String,
        slots: [{
          start: String,
          end: String
        }]
      }]
    },
    stats: {
       averageRating: { type: Number, default: 0 },
        totalRatings: { type: Number, default: 0 },
        totalConsultations: { type: Number, default: 0 },
        totalCompletedConsultations: { type: Number, default: 0 },
        responseTime: { type: Number, default: 0 },
        acceptanceRate: { type: Number, default: 0 }
    },
  },

  
  // Add these general fields
  isOnline: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now },
  walletBalance: { type: Number, default: 0 },
  // Tax information (optional - not all countries require this)
  taxInfo: {
    // Basic tax identification
    hasTaxInfo: { type: Boolean, default: false },
    taxId: { type: String, default: '', trim: true },
    taxIdType: {
      type: String,
      enum: ['SSN', 'EIN', 'TIN', 'VAT', 'GST', 'PAN', 'NIF', 'ABN', 'CUIT', 'other', ''],
      default: '',
    },
    
    // Location for tax purposes
    taxCountry: { type: String, default: '', trim: true },
    taxState: { type: String, default: '', trim: true },
    taxResidency: { type: String, default: '', trim: true },
    
    // Tax rates and exemptions
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    isTaxExempt: { type: Boolean, default: false },
    exemptionReason: { type: String, default: '', trim: true },
    exemptionCertificateId: { type: String, default: '', trim: true },
    
    // Business-specific fields (for hospitals, doctors with businesses)
    businessName: { type: String, default: '', trim: true },
    businessType: {
      type: String,
      enum: ['individual', 'sole_proprietorship', 'llc', 'corporation', 'partnership', 'non_profit', ''],
      default: '',
    },
    businessRegistrationNumber: { type: String, default: '', trim: true },
    
    // Tax forms and compliance
    taxFormPreference: {
      type: String,
      enum: ['1099', 'W-9', 'W-8BEN', 'W-8ECI', 'W-8IMY', 'W-8EXP', 'other', ''],
      default: '',
    },
    taxTreatyBenefits: { type: Boolean, default: false },
    treatyCountry: { type: String, default: '', trim: true },
    treatyArticle: { type: String, default: '', trim: true },
    
    // Financial thresholds
    annualEarningsThreshold: { type: Number, default: 0 },
    taxWithholdingRate: { type: Number, default: 0, min: 0, max: 100 },
    
    // Documents
    documents: [{
      name: { type: String, required: true },
      type: {
        type: String,
        enum: ['tax_id', 'exemption_certificate', 'business_registration', 'treaty_form', 'other'],
        required: true
      },
      url: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
      verified: { type: Boolean, default: false },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: { type: Date },
      expiryDate: { type: Date },
      notes: { type: String, default: '' }
    }],
    
    // Verification
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    lastVerified: { type: Date },
    
    // Status and notes
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'expired', 'not_required'],
      default: 'pending'
    },
    adminNotes: { type: String, default: '', trim: true },
    lastTaxReportDate: { type: Date, default: null },
    nextTaxReportDue: { type: Date, default: null },
    
    // Metadata
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  //
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationMethod: {
    type: String,
    enum: ['email', 'manual'],
    default: 'email',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  passwordResetOtp: {
    type: String,
    select: false,
  },
  passwordResetOtpExpires: {
    type: Date,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Automatically update timestamps before saving
UserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

UserSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Guarantee roleStatus exists for every user
UserSchema.pre('save', function (next) {
  if (!this.roleStatus) {
    this.roleStatus = {
      isActive: this.role === 'user' ? true : false,
      approvedByAdmin: this.role === 'admin' ? true : false,
      verifiedLicense: false,
      licenseNumber: '',
      approvalDate: null,
    };
  }
  this.updatedAt = new Date();
  next();
});

UserSchema.pre('save', function (next) {
  // Ensure roleStatus exists
  if (!this.roleStatus) {
    this.roleStatus = {
      isActive: false,
      approvedByAdmin: false,
      verifiedLicense: false,
      licenseNumber: '',
      issuedCountry: '',
      approvalDate: null,
    };
  }

  // Special case: if role is 'admin' or created by admin flow → auto-approve
  // We'll handle auto-approval in service layer instead (more reliable)
  // But keep basic defaults

  this.updatedAt = new Date();
  next();
});

UserSchema.index({ "profile.location.coordinates": "2dsphere" });
UserSchema.index({ role: 1 });
UserSchema.index({ 'roleStatus.approvedByAdmin': 1 });
UserSchema.index({ isDeleted: 1 });
UserSchema.index({ "profile.location.state": 1 });
UserSchema.index({ "profile.location.country": 1 });
UserSchema.index({ "healthcareProfile.stats.averageRating": -1 });
UserSchema.index({ "healthcareProfile.stats.totalRatings": -1 });
UserSchema.index({ "healthcareProfile.availability.isAvailable": -1 });
UserSchema.index({ role: 1, isVerified: 1, "roleStatus.isActive": 1 });

UserSchema.index({ passwordResetOtpExpires: 1 }, { expireAfterSeconds: 0 });

// Add this to your existing indexes
UserSchema.index({ 'taxInfo.status': 1 });
UserSchema.index({ 'taxInfo.verified': 1 });
UserSchema.index({ 'taxInfo.taxCountry': 1 });
UserSchema.index({ 'taxInfo.hasTaxInfo': 1 });

// this is all

export default mongoose.model<IUser, mongoose.Model<IUser>>('User', UserSchema);