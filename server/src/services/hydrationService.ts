import { Types } from 'mongoose';
import HydrationLog from '../models/HydrationLogModel';
import HydrationGoal from '../models/HydrationGoalModel';
import HydrationRecommendation from '../models/HydrationRecommendationModel';
import { HydrationCalculationService } from './hydrationCalculationService';
import { IHydrationStats, IBodyMetrics, ActivityLevel, Climate } from '../types/hydrationTypes';

export class HydrationService {
  
  /**
   * Log water intake
   */
  static async logIntake(
    userId: Types.ObjectId, 
    amount: number, 
    beverageType: string = 'water', 
    notes?: string
  ): Promise<any> {
    const log = new HydrationLog({
      userId,
      amount,
      beverageType,
      notes,
      timestamp: new Date()
    });

    await log.save();
    return log;
  }

  /**
   * Set or update hydration goal
   */
  static async setHydrationGoal(
    userId: Types.ObjectId,
    dailyGoal: number,
    activityLevel: ActivityLevel,
    climate: Climate,
    healthConditions: string[] = []
  ): Promise<any> {
    let goal = await HydrationGoal.findOne({ userId });
    
    if (goal) {
      goal.dailyGoal = dailyGoal;
      goal.activityLevel = activityLevel;
      goal.climate = climate;
      goal.healthConditions = healthConditions;
      goal.adjustedGoal = dailyGoal;
    } else {
      goal = new HydrationGoal({
        userId,
        dailyGoal,
        adjustedGoal: dailyGoal,
        activityLevel,
        climate,
        healthConditions
      });
    }

    await goal.save();
    return goal;
  }

  /**
   * Get today's hydration stats
   */
  static async getTodayStats(userId: Types.ObjectId): Promise<IHydrationStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's intake
    const todayLogs = await HydrationLog.find({
      userId,
      timestamp: { $gte: today, $lt: tomorrow }
    });

    const totalIntake = todayLogs.reduce((sum, log) => sum + log.amount, 0);
    
    // Get user's goal
    const goalDoc = await HydrationGoal.findOne({ userId });
    const goal = goalDoc?.dailyGoal || 2000; // Default goal

    // Get last intake time
    const lastIntakeTime = todayLogs.length > 0 
      ? todayLogs[todayLogs.length - 1].timestamp 
      : undefined;

    // Calculate 7-day average
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekLogs = await HydrationLog.aggregate([
      {
        $match: {
          userId: userId,
          timestamp: { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          dailyIntake: { $sum: '$amount' }
        }
      }
    ]);

    const averageDailyIntake = weekLogs.length > 0 
      ? Math.round(weekLogs.reduce((sum, day) => sum + day.dailyIntake, 0) / weekLogs.length)
      : 0;

    // Calculate streak (simplified)
    const streak = await this.calculateStreak(userId);

    // Get history (last 7 days)
    const history = await this.getWeeklyHistory(userId);

    return {
      totalIntake,
      goal,
      percentage: Math.round((totalIntake / goal) * 100),
      remaining: Math.max(0, goal - totalIntake),
      lastIntakeTime,
      averageDailyIntake,
      streak,
      history
    };
  }

  /**
   * Calculate current streak of meeting daily goal
   */
  static async calculateStreak(userId: Types.ObjectId): Promise<number> {
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (streak < 30) { // Check up to 30 days back
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayLogs = await HydrationLog.find({
        userId,
        timestamp: { $gte: dayStart, $lt: dayEnd }
      });

      const dayIntake = dayLogs.reduce((sum, log) => sum + log.amount, 0);
      const goalDoc = await HydrationGoal.findOne({ userId });
      const goal = goalDoc?.dailyGoal || 2000;

      if (dayIntake >= goal) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get weekly hydration history
   */
  static async getWeeklyHistory(userId: Types.ObjectId): Promise<{date: string; intake: number; goal: number; metGoal: boolean}[]> {
    const history = [];
    const goalDoc = await HydrationGoal.findOne({ userId });
    const goal = goalDoc?.dailyGoal || 2000;

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayLogs = await HydrationLog.find({
        userId,
        timestamp: { $gte: dayStart, $lt: dayEnd }
      });

      const intake = dayLogs.reduce((sum, log) => sum + log.amount, 0);
      
      history.push({
        date: date.toISOString().split('T')[0],
        intake,
        goal,
        metGoal: intake >= goal
      });
    }

    return history;
  }

  /**
   * Get hydration logs with pagination
   */
  static async getLogs(
    userId: Types.ObjectId, 
    page: number = 1, 
    limit: number = 10
  ): Promise<{ logs: any[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      HydrationLog.find({ userId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HydrationLog.countDocuments({ userId })
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Generate personalized recommendation based on body metrics
   */
  static async generatePersonalizedRecommendation(
    userId: Types.ObjectId, 
    bodyMetrics: IBodyMetrics
  ): Promise<any> {
    return await HydrationCalculationService.generateRecommendation(userId, bodyMetrics);
  }

  /**
   * Get current recommendation
   */
  static async getCurrentRecommendation(userId: Types.ObjectId): Promise<any> {
    return await HydrationRecommendation.findOne({ userId })
      .sort({ calculationDate: -1 })
      .lean();
  }

  /**
   * Delete hydration log
   */
  static async deleteLog(userId: Types.ObjectId, logId: Types.ObjectId): Promise<boolean> {
    const result = await HydrationLog.deleteOne({ _id: logId, userId });
    return result.deletedCount > 0;
  }
}