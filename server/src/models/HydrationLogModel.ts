import mongoose, { Schema } from 'mongoose';
import { IHydrationLog } from '../types/hydrationTypes';

const HydrationLogSchema = new Schema<IHydrationLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
    max: 2000
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  beverageType: {
    type: String,
    enum: ['water', 'tea', 'coffee', 'juice', 'soda', 'sports_drink', 'other'],
    default: 'water'
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound index for efficient daily queries
HydrationLogSchema.index({ userId: 1, timestamp: 1 });
HydrationLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IHydrationLog>('HydrationLog', HydrationLogSchema);