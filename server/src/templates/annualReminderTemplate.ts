export interface AnnualReminderData {
  userName: string;
  appName: string;
  appUrl: string;
  year: number;
  reminders?: {
    title: string;
    description: string;
    action?: string;
  }[];
}

export const generateAnnualReminderEmail = (data: AnnualReminderData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your ${data.year} Health Check-in</title>
  <style>
    body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); padding: 20px; }
    .container { max-width: 600px; margin: auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .header { text-align: center; padding-bottom: 30px; }
    .year-icon { font-size: 60px; margin-bottom: 20px; }
    h1 { color: #2d3748; font-size: 36px; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .intro { font-size: 18px; color: #4a5568; line-height: 1.6; margin: 25px 0; }
    .reminder-card { background: #f8f9fa; border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #4299e1; }
    .reminder-title { color: #2d3748; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
    .reminder-desc { color: #718096; line-height: 1.5; }
    .action-button { display: inline-block; background: #38b2ac; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; text-decoration: none; margin-top: 10px; }
    .callout { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; margin: 30px 0; text-align: center; }
    .main-button { display: inline-block; background: #2d3748; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 20px; }
    .footer { margin-top: 40px; text-align: center; color: #718096; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="year-icon">🎯🌟📈</div>
      <h1>${data.year} Health Check-in</h1>
      <p class="intro">
        As we welcome ${data.year}, it's the perfect time to review your health journey and set wellness goals for the year ahead.
      </p>
    </div>
    
    <div style="margin: 30px 0;">
      <h2 style="color: #4a5568; font-size: 24px; margin-bottom: 20px;">Your Health Reminders</h2>
      
      ${data.reminders?.map(reminder => `
      <div class="reminder-card">
        <div class="reminder-title">${reminder.title}</div>
        <div class="reminder-desc">${reminder.description}</div>
        ${reminder.action ? `<a href="${data.appUrl}${reminder.action}" class="action-button">Take Action →</a>` : ''}
      </div>
      `).join('')}
      
      <div class="reminder-card" style="border-left-color: #48bb78;">
        <div class="reminder-title">🎉 Your ${data.year} Health Commitment</div>
        <div class="reminder-desc">Small, consistent steps lead to big health improvements. What's one health goal you want to achieve this year?</div>
      </div>
    </div>
    
    <div class="callout">
      <h2 style="margin: 0; font-size: 24px;">Ready for a Healthier ${data.year}?</h2>
      <p style="margin: 15px 0 0; opacity: 0.9;">Book your annual health check-up and start the year right!</p>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${data.appUrl}/book/annual-checkup" class="main-button">Schedule Annual Check-up</a>
      <p style="margin-top: 15px; font-size: 14px; color: #718096;">
        Proactive care is the best investment in your health
      </p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
      <p>Here's to a healthy and happy ${data.year}!</p>
      <p style="font-size: 12px; margin-top: 10px;">You're receiving this as part of our annual health awareness program.</p>
    </div>
  </div>
</body>
</html>
  `;
};