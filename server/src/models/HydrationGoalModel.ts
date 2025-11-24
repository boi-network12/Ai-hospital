import mongoose, { Schema } from 'mongoose';
import { IHydrationGoal } from '../types/hydrationTypes';

const HydrationGoalSchema = new Schema<IHydrationGoal>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  dailyGoal: {
    type: Number,
    required: true,
    min: 500,
    max: 10000
  },
  adjustedGoal: {
    type: Number,
    min: 500,
    max: 10000
  },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'heavy', 'extreme'],
    default: 'moderate'
  },
  climate: {
    type: String,
    enum: ['temperate', 'hot', 'very_hot', 'humid'],
    default: 'temperate'
  },
  healthConditions: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for efficient queries
HydrationGoalSchema.index({ userId: 1 });
HydrationGoalSchema.index({ updatedAt: 1 });

export default mongoose.model<IHydrationGoal>('HydrationGoal', HydrationGoalSchema);