import { Request, Response } from 'express';
import { Types } from 'mongoose';
import HydrationGoal from '../models/HydrationGoalModel';
import { HydrationService } from '../services/hydrationService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { IBodyMetrics } from '../types/hydrationTypes';

/**
 * Log water intake
 */
export const logIntake = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, beverageType, notes } = req.body;
    const userId = req.user._id;

    const validBeverageTypes = ['water', 'tea', 'coffee', 'juice', 'soda', 'sports_drink', 'other'];
    const validatedBeverageType = validBeverageTypes.includes(beverageType) 
      ? beverageType 
      : 'water';

    const log = await HydrationService.logIntake(
      new Types.ObjectId(userId), 
      amount, 
      validatedBeverageType, 
      notes
    );

    res.status(201).json({
      success: true,
      message: 'Water intake logged successfully',
      data: log
    });
  } catch (error) {
    console.error('Log intake error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log water intake'
    });
  }
};

/**
 * Set hydration goal
 */
export const setGoal = async (req: AuthRequest, res: Response) => {
  try {
    const { dailyGoal, activityLevel, climate, healthConditions } = req.body;
    const userId = req.user._id;

    if (!dailyGoal || dailyGoal < 500 || dailyGoal > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Daily goal must be between 500ml and 10000ml'
      });
    }

    const goal = await HydrationService.setHydrationGoal(
      new Types.ObjectId(userId),
      dailyGoal,
      activityLevel,
      climate,
      healthConditions || []
    );

    res.json({
      success: true,
      message: 'Hydration goal set successfully',
      data: goal
    });
  } catch (error) {
    console.error('Set goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set hydration goal'
    });
  }
};

// In src/controllers/hydrationController.ts - ADD THIS CONTROLLER
export const getGoal = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const goal = await HydrationGoal.findOne({ userId: new Types.ObjectId(userId) });
    
    if (!goal) {
      return res.json({
        success: true,
        data: null
      });
    }

    res.json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hydration goal'
    });
  }
};


/**
 * Get today's hydration stats
 */
export const getTodayStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const stats = await HydrationService.getTodayStats(new Types.ObjectId(userId));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hydration stats'
    });
  }
};

/**
 * Get hydration logs
 */
export const getLogs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await HydrationService.getLogs(
      new Types.ObjectId(userId), 
      page, 
      limit
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hydration logs'
    });
  }
};

/**
 * Generate personalized hydration recommendation
 */
export const generateRecommendation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const bodyMetrics: IBodyMetrics = req.body;

    // Validate required fields
    if (!bodyMetrics.weight || !bodyMetrics.height || !bodyMetrics.age || !bodyMetrics.gender) {
      return res.status(400).json({
        success: false,
        message: 'Weight, height, age, and gender are required'
      });
    }

    const recommendation = await HydrationService.generatePersonalizedRecommendation(
      new Types.ObjectId(userId),
      bodyMetrics
    );

    res.json({
      success: true,
      message: 'Personalized hydration recommendation generated',
      data: recommendation
    });
  } catch (error) {
    console.error('Generate recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate hydration recommendation'
    });
  }
};

/**
 * Get current recommendation
 */
export const getRecommendation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    
    // Add ObjectId validation
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const recommendation = await HydrationService.getCurrentRecommendation(
      new Types.ObjectId(userId)
    );

    res.json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    console.error('Get recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hydration recommendation'
    });
  }
};

/**
 * Delete hydration log
 */
export const deleteLog = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { logId } = req.params;

    if (!Types.ObjectId.isValid(logId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid log ID'
      });
    }

    const deleted = await HydrationService.deleteLog(
      new Types.ObjectId(userId),
      new Types.ObjectId(logId)
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    res.json({
      success: true,
      message: 'Hydration log deleted successfully'
    });
  } catch (error) {
    console.error('Delete log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete hydration log'
    });
  }
};