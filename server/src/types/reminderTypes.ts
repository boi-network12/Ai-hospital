export type ReminderType = 
  | 'birthday'
  | 'holiday'
  | 'monthly_update'
  | 'annual_checkup'
  | 'appointment_reminder'
  | 'medication_reminder'
  | 'health_tip'
  | 'custom';

export interface ReminderSchedule {
  type: ReminderType;
  cronExpression: string;
  enabled: boolean;
  lastSent?: Date;
  nextSend?: Date;
}

export interface BirthdayReminderData {
  userName: string;
  age?: number;
  offerCode?: string;
  discountPercentage?: number;
}

export interface HolidayReminderData {
  holidayName: string;
  date: Date;
  greeting: string;
  serviceNotice?: string;
}

export interface MonthlyStatsData {
  consultations: number;
  messages: number;
  healthScore?: number;
  achievements?: string[];
}

export interface ReminderPreferences {
  receiveBirthdayReminders: boolean;
  receiveHolidayGreetings: boolean;
  receiveMonthlyUpdates: boolean;
  receiveAnnualReminders: boolean;
  preferredTime: string; // "09:00", "18:00", etc.
  timezone: string;
}