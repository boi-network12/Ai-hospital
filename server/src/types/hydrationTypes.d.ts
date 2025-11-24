import { Types } from 'mongoose';

export interface IHydrationGoal {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  dailyGoal: number; // in ml
  adjustedGoal?: number; // in ml (adjusted based on factors)
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'heavy' | 'extreme';
  climate: 'temperate' | 'hot' | 'very_hot' | 'humid';
  healthConditions: string[]; // conditions that affect hydration
  createdAt: Date;
  updatedAt: Date;
}

export interface IHydrationLog {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number; // in ml
  timestamp: Date;
  beverageType: 'water' | 'tea' | 'coffee' | 'juice' | 'soda' | 'sports_drink' | 'other';
  notes?: string;
  createdAt: Date;
}

export interface IHydrationRecommendation {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  baseRequirement: number; // in ml
  activityAdjustment: number; // in ml
  climateAdjustment: number; // in ml
  healthAdjustment: number; // in ml
  totalRecommended: number; // in ml
  factors: {
    weight: number; // kg
    height: number; // cm
    age: number;
    gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
    activityLevel: string;
    climate: string;
    healthConditions: string[];
  };
  calculationDate: Date;
  nextCalculationDate: Date;
}

export interface IHydrationStats {
  totalIntake: number; // ml for current day
  goal: number; // ml
  percentage: number; // percentage of goal achieved
  remaining: number; // ml remaining to reach goal
  lastIntakeTime?: Date;
  averageDailyIntake: number; // ml (7-day average)
  streak: number; // consecutive days meeting goal
  history: {
    date: string;
    intake: number;
    goal: number;
    metGoal: boolean;
  }[];
}

export interface IBodyMetrics {
  weight: number; // kg
  height: number; // cm
  age: number;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'heavy' | 'extreme';
  climate: 'temperate' | 'hot' | 'very_hot' | 'humid';
  healthConditions: string[];
}

// Define the allowed values as const assertions
export const ACTIVITY_LEVELS = [
  'sedentary',
  'light',
  'moderate',
  'heavy',
  'extreme'
] as const;

export const CLIMATES = [
  'temperate',
  'hot',
  'very_hot',
  'humid'
] as const;

export type ActivityLevel = typeof ACTIVITY_LEVELS[number];
export type Climate = typeof CLIMATES[number];