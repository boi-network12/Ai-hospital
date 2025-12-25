// Export birthday template
export { generateBirthdayEmail } from './birthdayTemplate';

// Export holiday template and its types
export { 
  generateHolidayEmail,
  type HolidayTemplateData 
} from './holidayTemplate';

// Export monthly update template and its types
export { 
  generateMonthlyUpdateEmail,
  type MonthlyUpdateData 
} from './monthlyUpdateTemplate';

// Export annual reminder template and its types
export { 
  generateAnnualReminderEmail,
  type AnnualReminderData 
} from './annualReminderTemplate';

// You can also add a utility function for all templates
export const templateUtils = {
  /**
   * Get appropriate greeting based on time of day
   */
  getTimeGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  },

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  /**
   * Get month name
   */
  getMonthName(monthIndex: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
  },

  /**
   * Generate holiday-specific greetings
   */
  getHolidayGreeting(holidayName: string): string {
    const greetings: Record<string, string> = {
      'Christmas': 'Merry Christmas',
      'New Year': 'Happy New Year',
      'Eid al-Fitr': 'Eid Mubarak',
      'Eid al-Adha': 'Eid Mubarak',
      'Diwali': 'Happy Diwali',
      'Thanksgiving': 'Happy Thanksgiving',
      'Boxing Day': 'Happy Boxing Day'
    };
    return greetings[holidayName] || `Happy ${holidayName}`;
  }
};

// Example usage in other files:
// import { generateBirthdayEmail, templateUtils } from '../templates';