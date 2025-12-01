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
        responseTime: { type: Number, default: 0 },
        acceptanceRate: { type: Number, default: 0 }
    },
  },

  
  // Add these general fields
  isOnline: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now },
  walletBalance: { type: Number, default: 0 },
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

// this is all

export default mongoose.model<IUser, mongoose.Model<IUser>>('User', UserSchema);