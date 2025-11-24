import { IBodyMetrics } from '../types/hydrationTypes';
import HydrationRecommendation from '../models/HydrationRecommendationModel';

export class HydrationCalculationService {
  
  /**
   * Calculate base water requirement based on weight
   */
  static calculateBaseRequirement(weight: number, age: number, gender: string): number {
    // Base calculation: 30-35 ml per kg of body weight
    let baseMultiplier = 35;
    
    // Adjust for age
    if (age < 18) baseMultiplier = 40; // Children need more
    else if (age > 65) baseMultiplier = 30; // Elderly need less
    
    // Adjust for gender
    if (gender === 'Male') baseMultiplier += 2;
    else if (gender === 'Female') baseMultiplier -= 2;
    
    return Math.round(weight * baseMultiplier);
  }

  /**
   * Calculate activity adjustment
   */
  static calculateActivityAdjustment(activityLevel: string, baseRequirement: number): number {
    const adjustments = {
      sedentary: 0,
      light: baseRequirement * 0.1,      // +10%
      moderate: baseRequirement * 0.2,   // +20%
      heavy: baseRequirement * 0.3,      // +30%
      extreme: baseRequirement * 0.5     // +50%
    };
    
    return Math.round(adjustments[activityLevel as keyof typeof adjustments] || 0);
  }

  /**
   * Calculate climate adjustment
   */
  static calculateClimateAdjustment(climate: string, baseRequirement: number): number {
    const adjustments = {
      temperate: 0,
      hot: baseRequirement * 0.1,        // +10%
      very_hot: baseRequirement * 0.2,   // +20%
      humid: baseRequirement * 0.15      // +15%
    };
    
    return Math.round(adjustments[climate as keyof typeof adjustments] || 0);
  }

  /**
   * Calculate health conditions adjustment
   */
  static calculateHealthAdjustment(healthConditions: string[], baseRequirement: number): number {
    let adjustment = 0;
    
    healthConditions.forEach(condition => {
      switch (condition.toLowerCase()) {
        case 'fever':
        case 'infection':
          adjustment += baseRequirement * 0.2; // +20%
          break;
        case 'kidney_stones':
          adjustment += baseRequirement * 0.3; // +30%
          break;
        case 'pregnancy':
          adjustment += baseRequirement * 0.25; // +25%
          break;
        case 'breastfeeding':
          adjustment += baseRequirement * 0.3; // +30%
          break;
        case 'diabetes':
          adjustment += baseRequirement * 0.15; // +15%
          break;
        default:
          adjustment += baseRequirement * 0.1; // +10% for other conditions
      }
    });
    
    return Math.round(adjustment);
  }

  /**
   * Calculate total recommended water intake
   */
  static calculateTotalRecommended(bodyMetrics: IBodyMetrics): number {
    const {
      weight,
      age,
      gender,
      activityLevel,
      climate,
      healthConditions
    } = bodyMetrics;

    const baseRequirement = this.calculateBaseRequirement(weight, age, gender);
    const activityAdjustment = this.calculateActivityAdjustment(activityLevel, baseRequirement);
    const climateAdjustment = this.calculateClimateAdjustment(climate, baseRequirement);
    const healthAdjustment = this.calculateHealthAdjustment(healthConditions, baseRequirement);

    const totalRecommended = baseRequirement + activityAdjustment + climateAdjustment + healthAdjustment;

    // Ensure minimum and maximum limits
    return Math.max(1500, Math.min(5000, totalRecommended));
  }

  /**
   * Generate and save hydration recommendation
   */
  static async generateRecommendation(userId: any, bodyMetrics: IBodyMetrics): Promise<any> {
    const {
      weight,
      height,
      age,
      gender,
      activityLevel,
      climate,
      healthConditions
    } = bodyMetrics;

    const baseRequirement = this.calculateBaseRequirement(weight, age, gender);
    const activityAdjustment = this.calculateActivityAdjustment(activityLevel, baseRequirement);
    const climateAdjustment = this.calculateClimateAdjustment(climate, baseRequirement);
    const healthAdjustment = this.calculateHealthAdjustment(healthConditions, baseRequirement);
    const totalRecommended = baseRequirement + activityAdjustment + climateAdjustment + healthAdjustment;

    // Save recommendation
    const recommendation = new HydrationRecommendation({
      userId,
      baseRequirement,
      activityAdjustment,
      climateAdjustment,
      healthAdjustment,
      totalRecommended,
      factors: {
        weight,
        height,
        age,
        gender,
        activityLevel,
        climate,
        healthConditions
      },
      calculationDate: new Date(),
      nextCalculationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    await recommendation.save();
    return recommendation;
  }

  /**
   * Calculate optimal hydration schedule
   */
  static calculateHydrationSchedule(dailyGoal: number): { time: string; amount: number }[] {
    const schedule = [];
    const wakeTime = 7 * 60; // 7:00 AM in minutes
    const bedTime = 22 * 60; // 10:00 PM in minutes
    const wakingHours = bedTime - wakeTime;
    
    // Recommended: drink every 2 hours
    const interval = 120; // 2 hours in minutes
    const slots = Math.floor(wakingHours / interval);
    const amountPerSlot = Math.round(dailyGoal / slots);
    
    for (let i = 0; i < slots; i++) {
      const timeInMinutes = wakeTime + (i * interval);
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = timeInMinutes % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      schedule.push({
        time: timeString,
        amount: amountPerSlot
      });
    }
    
    return schedule;
  }
}