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

UserSchema.index({ role: 1 });
UserSchema.index({ 'roleStatus.approvedByAdmin': 1 });
UserSchema.index({ isDeleted: 1 });

// this is all

export default mongoose.model<IUser>('User', UserSchema);
