import cron from 'node-cron';
import nodemailer from 'nodemailer';
import User from '../models/UserModel';
import Notification from '../models/NotificationModel';
import { generateBirthdayEmail } from '../templates/birthdayTemplate';
import { generateHolidayEmail, HolidayTemplateData } from '../templates/holidayTemplate';
import { generateMonthlyUpdateEmail, MonthlyUpdateData } from '../templates/monthlyUpdateTemplate';
import { generateAnnualReminderEmail, AnnualReminderData } from '../templates/annualReminderTemplate';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

class ReminderService {
  private appName: string;
  private appUrl: string;

  constructor() {
    this.appName = process.env.APP_NAME || 'HealthConnect';
    this.appUrl = process.env.APP_URL || 'https://yourapp.com';
  }

  /**
   * Initialize all scheduled reminders
   */
  public initializeReminders() {
    // 1. Daily birthday check (runs at 9 AM)
    cron.schedule('0 9 * * *', () => this.checkBirthdays());

    // 2. Monthly update (1st of every month at 10 AM)
    cron.schedule('0 10 1 * *', () => this.sendMonthlyUpdates());

    // 3. Annual reminder (January 1st at 11 AM)
    cron.schedule('0 11 1 1 *', () => this.sendAnnualReminders());

    // 4. Holiday reminders
    this.scheduleHolidayReminders();

    console.log('🎯 Reminder system initialized');
  }

  /**
   * PUBLIC: Check and send birthday wishes
   */
  public async checkBirthdays() {
    try {
      const today = new Date();
      const todayStr = `${today.getMonth() + 1}-${today.getDate()}`;

      // Find users with birthdays today
      const users = await User.find({
        'profile.dateOfBirth': {
          $ne: null
        },
        isDeleted: false,
        'notificationSettings.emailNotifications': true
      });

      const birthdayUsers = users.filter(user => {
        if (!user.profile?.dateOfBirth) return false;
        const dob = new Date(user.profile.dateOfBirth);
        const dobStr = `${dob.getMonth() + 1}-${dob.getDate()}`;
        return dobStr === todayStr;
      });

      console.log(`🎂 Found ${birthdayUsers.length} birthdays today`);

      for (const user of birthdayUsers) {
        await this.sendBirthdayReminder(user);
      }

      return {
        success: true,
        count: birthdayUsers.length,
        users: birthdayUsers.map(u => ({ id: u._id, name: u.name, email: u.email }))
      };
    } catch (error) {
      console.error('Error checking birthdays:', error);
      throw error;
    }
  }

  /**
   * Send birthday email and notification
   */
  private async sendBirthdayReminder(user: any) {
    try {
      const html = generateBirthdayEmail(user.name, this.appName, this.appUrl);

      // Send email
      await transporter.sendMail({
        from: `"${this.appName}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: user.email,
        subject: `🎂 Happy Birthday, ${user.name}!`,
        html
      });

      // Create notification
      await Notification.create({
        user: user._id,
        type: 'general_announcement',
        title: 'Happy Birthday! 🎉',
        message: `Wishing you a wonderful birthday filled with joy and good health! Check your email for a special birthday offer.`,
        priority: 'high',
        actionUrl: '/book-now',
        data: { isBirthday: true, offerCode: 'BIRTHDAY2024' }
      });

      console.log(`✅ Birthday sent to ${user.email}`);
    } catch (error) {
      console.error(`Failed to send birthday to ${user.email}:`, error);
    }
  }

  /**
   * Schedule holiday reminders
   */
  private scheduleHolidayReminders() {
    // Define holidays (date format: 'MM-DD')
    const holidays = [
      { name: 'New Year', date: '01-01', daysBefore: 3 },
      { name: 'Christmas', date: '12-25', daysBefore: 5 },
      { name: 'Eid al-Fitr', date: '04-10', daysBefore: 3 },
      { name: 'Eid al-Adha', date: '06-16', daysBefore: 3 },
      { name: 'Diwali', date: '10-31', daysBefore: 3 },
      { name: 'Thanksgiving', date: '11-28', daysBefore: 3 },
      { name: 'Boxing Day', date: '12-26', daysBefore: 2 },
    ];

    // Schedule each holiday
    holidays.forEach(holiday => {
      const [month, day] = holiday.date.split('-').map(Number);
      
      // Send reminder X days before holiday
      const reminderDate = new Date(new Date().getFullYear(), month - 1, day - holiday.daysBefore);
      
      cron.schedule(`0 10 ${reminderDate.getDate()} ${reminderDate.getMonth() + 1} *`, () => {
        this.sendHolidayReminder(holiday.name, holiday.date);
      });
    });
  }

  /**
   * PUBLIC: Send holiday reminder to all users
   */
  public async sendHolidayReminder(holidayName: string, holidayDate?: string) {
    try {
      const users = await User.find({
        isDeleted: false,
        'notificationSettings.emailNotifications': true
      }).select('email name');

      const dateStr = holidayDate || `${new Date().getMonth() + 1}-${new Date().getDate()}`;
      const [month, day] = dateStr.split('-').map(Number);
      const date = new Date(new Date().getFullYear(), month - 1, day);
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      for (const user of users) {
        const templateData: HolidayTemplateData = {
          holidayName,
          userName: user.name,
          appName: this.appName,
          appUrl: this.appUrl,
          date: formattedDate,
          operatingHours: holidayName === 'Christmas' 
            ? 'Emergency services only on December 25th'
            : '24/7 services available'
        };

        const html = generateHolidayEmail(templateData);

        await transporter.sendMail({
          from: `"${this.appName}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
          to: user.email,
          subject: `🎉 ${holidayName} Greetings from ${this.appName}`,
          html
        });

        // Create notification
        await Notification.create({
          user: user._id,
          type: 'general_announcement',
          title: `${holidayName} Reminder`,
          message: `Wishing you a blessed ${holidayName}! Our service hours may vary.`,
          priority: 'medium',
          actionUrl: '/emergency'
        });
      }

      console.log(`✅ ${holidayName} reminders sent to ${users.length} users`);
      return { success: true, count: users.length };
    } catch (error) {
      console.error(`Error sending ${holidayName} reminders:`, error);
      throw error;
    }
  }

  /**
   * PUBLIC: Send monthly updates to users
   */
  public async sendMonthlyUpdates() {
    try {
      const users = await User.find({
        isDeleted: false,
        'notificationSettings.emailNotifications': true
      }).select('email name');

      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      const currentMonth = monthNames[now.getMonth()];
      const currentYear = now.getFullYear();

      // Get health tip for the month
      const healthTips = [
        "Stay hydrated! Drink at least 8 glasses of water daily.",
        "Aim for 30 minutes of moderate exercise most days.",
        "Practice mindfulness or meditation for 10 minutes daily.",
        "Get 7-9 hours of quality sleep each night.",
        "Include colorful fruits and vegetables in every meal."
      ];
      const randomTip = healthTips[Math.floor(Math.random() * healthTips.length)];

      for (const user of users) {
        const templateData: MonthlyUpdateData = {
          userName: user.name,
          appName: this.appName,
          appUrl: this.appUrl,
          month: currentMonth,
          year: currentYear,
          healthTip: randomTip,
          upcomingFeatures: [
            'New telemedicine features',
            'Health tracking dashboard',
            'Medication reminders'
          ]
        };

        const html = generateMonthlyUpdateEmail(templateData);

        await transporter.sendMail({
          from: `"${this.appName}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
          to: user.email,
          subject: `📊 Your ${currentMonth} ${currentYear} Health Update`,
          html
        });

        // Create notification
        await Notification.create({
          user: user._id,
          type: 'general_announcement',
          title: `Your ${currentMonth} Health Update`,
          message: `Check your email for this month's health insights and tips!`,
          priority: 'medium',
          actionUrl: '/dashboard'
        });
      }

      console.log(`✅ Monthly updates sent to ${users.length} users`);
      return { success: true, count: users.length };
    } catch (error) {
      console.error('Error sending monthly updates:', error);
      throw error;
    }
  }

  /**
   * PUBLIC: Send annual health reminders
   */
  public async sendAnnualReminders() {
    try {
      const users = await User.find({
        isDeleted: false,
        'notificationSettings.emailNotifications': true
      }).select('email name');

      const currentYear = new Date().getFullYear();

      for (const user of users) {
        const templateData: AnnualReminderData = {
          userName: user.name,
          appName: this.appName,
          appUrl: this.appUrl,
          year: currentYear,
          reminders: [
            {
              title: 'Annual Health Check-up',
              description: 'Schedule your yearly comprehensive health examination.',
              action: '/book/annual-checkup'
            },
            {
              title: 'Update Medical Information',
              description: 'Review and update your medical history and emergency contacts.',
              action: '/profile/medical'
            },
            {
              title: 'Vaccination Review',
              description: 'Check if you\'re due for any vaccinations or boosters.',
              action: '/vaccination'
            }
          ]
        };

        const html = generateAnnualReminderEmail(templateData);

        await transporter.sendMail({
          from: `"${this.appName}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
          to: user.email,
          subject: `🎯 Your ${currentYear} Health Check-in from ${this.appName}`,
          html
        });

        // Create notification
        await Notification.create({
          user: user._id,
          type: 'medical',
          title: `Your ${currentYear} Health Plan`,
          message: `Start the year right! Plan your health goals and check-ups.`,
          priority: 'high',
          actionUrl: '/health-plan',
          data: { year: currentYear, type: 'annual-review' }
        });
      }

      console.log(`✅ Annual reminders sent to ${users.length} users`);
      return { success: true, count: users.length };
    } catch (error) {
      console.error('Error sending annual reminders:', error);
      throw error;
    }
  }

  /**
   * Send ad-hoc reminder (can be called manually)
   */
  public async sendCustomReminder(
    userIds: string[],
    type: 'birthday' | 'holiday' | 'monthly' | 'annual' | 'custom',
    customData?: any
  ) {
    try {
      const users = await User.find({
        _id: { $in: userIds },
        isDeleted: false
      }).select('email name profile');

      for (const user of users) {
        let html: string;
        let subject: string;

        switch (type) {
          case 'birthday':
            html = generateBirthdayEmail(user.name, this.appName, this.appUrl);
            subject = `🎂 Happy Birthday, ${user.name}!`;
            break;
          case 'custom':
            // Custom template logic here
            html = customData.html || '<p>Custom reminder</p>';
            subject = customData.subject || 'Reminder from HealthConnect';
            break;
          default:
            continue;
        }

        await transporter.sendMail({
          from: `"${this.appName}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
          to: user.email,
          subject,
          html
        });

        console.log(`✅ Custom ${type} reminder sent to ${user.email}`);
      }

      return { success: true, count: users.length };
    } catch (error) {
      console.error('Error sending custom reminder:', error);
      throw error;
    }
  }

  /**
   * Get today's birthdays (for admin dashboard)
   */
  public async getTodaysBirthdays() {
    try {
      const today = new Date();
      const todayStr = `${today.getMonth() + 1}-${today.getDate()}`;

      const users = await User.find({
        'profile.dateOfBirth': {
          $ne: null
        },
        isDeleted: false
      }).select('name email profile.dateOfBirth');

      const birthdayUsers = users.filter(user => {
        if (!user.profile?.dateOfBirth) return false;
        const dob = new Date(user.profile.dateOfBirth);
        const dobStr = `${dob.getMonth() + 1}-${dob.getDate()}`;
        return dobStr === todayStr;
      });

      return {
        count: birthdayUsers.length,
        users: birthdayUsers.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          dateOfBirth: u.profile?.dateOfBirth
        }))
      };
    } catch (error) {
      console.error('Error getting today\'s birthdays:', error);
      throw error;
    }
  }

  /**
   * Get upcoming holidays
   */
  public getUpcomingHolidays() {
    const holidays = [
      { name: 'New Year', date: '01-01' },
      { name: 'Christmas', date: '12-25' },
      { name: 'Eid al-Fitr', date: '04-10' },
      { name: 'Eid al-Adha', date: '06-16' },
      { name: 'Diwali', date: '10-31' },
      { name: 'Thanksgiving', date: '11-28' },
      { name: 'Boxing Day', date: '12-26' },
    ];

    const today = new Date();
    const currentYear = today.getFullYear();

    return holidays.map(holiday => {
      const [month, day] = holiday.date.split('-').map(Number);
      const holidayDate = new Date(currentYear, month - 1, day);
      const daysUntil = Math.ceil((holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        name: holiday.name,
        date: holidayDate,
        daysUntil: daysUntil >= 0 ? daysUntil : 365 + daysUntil, // for next year
        isToday: daysUntil === 0
      };
    }).sort((a, b) => a.daysUntil - b.daysUntil);
  }
}

export default new ReminderService();