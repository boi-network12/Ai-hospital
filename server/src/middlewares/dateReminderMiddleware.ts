import { Request, Response, NextFunction } from 'express';
import reminderService from '../services/reminderService';

/**
 * Middleware to check if today is a special date
 * and send appropriate notifications
 */
export const dateReminderMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Don't block the request, run in background
  setImmediate(async () => {
    try {
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth() + 1;
      
      // Check for special dates
      const isNewYear = month === 1 && day === 1;
      const isChristmas = month === 12 && day === 25;
      const isSpecialDay = isNewYear || isChristmas;
      
      if (isSpecialDay) {
        // Send immediate holiday greeting
        const holidayName = isNewYear ? 'New Year' : 'Christmas';
        console.log(`🎉 Today is ${holidayName}! Sending greetings...`);
        
        // You can trigger holiday emails here if needed
        // await reminderService.sendHolidayReminder(holidayName);
      }
    } catch (error) {
      console.error('Error in date reminder middleware:', error);
    }
  });

  next();
};

/**
 * API endpoint to trigger reminders manually (admin only)
 */
export const triggerReminder = async (req: Request, res: Response) => {
  try {
    const { type, userIds, customData } = req.body;
    const user = (req as any).user;

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can trigger reminders' });
    }

    if (type === 'custom' && (!customData?.html || !customData?.subject)) {
      return res.status(400).json({ 
        message: 'Custom data must include html and subject' 
      });
    }

    if (userIds && Array.isArray(userIds)) {
      const result = await reminderService.sendCustomReminder(userIds, type, customData);
      return res.json({ 
        message: `Custom ${type} reminder sent to ${result.count} users`,
        result
      });
    }

    // Trigger specific reminder type for all users
    let result;
    switch (type) {
      case 'birthday':
        result = await reminderService.checkBirthdays();
        break;
      case 'monthly':
        result = await reminderService.sendMonthlyUpdates();
        break;
      case 'annual':
        result = await reminderService.sendAnnualReminders();
        break;
      case 'holiday':
        if (!customData?.holidayName) {
          return res.status(400).json({ 
            message: 'Holiday name is required for holiday reminders' 
          });
        }
        result = await reminderService.sendHolidayReminder(customData.holidayName, customData.date);
        break;
      default:
        return res.status(400).json({ 
          message: 'Invalid reminder type. Use: birthday, monthly, annual, holiday, or custom' 
        });
    }

    res.json({ 
      message: `${type} reminders triggered successfully`,
      result
    });
  } catch (error: any) {
    console.error('Error triggering reminder:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get reminder stats (admin only)
 */
export const getReminderStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view reminder stats' });
    }

    const todaysBirthdays = await reminderService.getTodaysBirthdays();
    const upcomingHolidays = reminderService.getUpcomingHolidays();

    res.json({
      todaysBirthdays,
      upcomingHolidays,
      stats: {
        totalBirthdaysToday: todaysBirthdays.count,
        nextHoliday: upcomingHolidays[0]
      }
    });
  } catch (error: any) {
    console.error('Error getting reminder stats:', error);
    res.status(500).json({ message: error.message });
  }
};