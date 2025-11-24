import mongoose, { Schema } from 'mongoose';
import { IHydrationRecommendation } from '../types/hydrationTypes';

const HydrationRecommendationSchema = new Schema<IHydrationRecommendation>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  baseRequirement: {
    type: Number,
    required: true
  },
  activityAdjustment: {
    type: Number,
    required: true
  },
  climateAdjustment: {
    type: Number,
    required: true
  },
  healthAdjustment: {
    type: Number,
    required: true
  },
  totalRecommended: {
    type: Number,
    required: true
  },
  factors: {
    weight: Number,
    height: Number,
    age: Number,
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say']
    },
    activityLevel: String,
    climate: String,
    healthConditions: [String]
  },
  calculationDate: {
    type: Date,
    default: Date.now
  },
  nextCalculationDate: {
    type: Date,
    required: true
  }
});

// Index for efficient queries and automatic cleanup
HydrationRecommendationSchema.index({ userId: 1, calculationDate: -1 });
HydrationRecommendationSchema.index({ nextCalculationDate: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IHydrationRecommendation>('HydrationRecommendation', HydrationRecommendationSchema);