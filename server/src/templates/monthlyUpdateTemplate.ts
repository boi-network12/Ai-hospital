export interface MonthlyUpdateData {
  userName: string;
  appName: string;
  appUrl: string;
  month: string;
  year: number;
  stats?: {
    consultations?: number;
    healthTips?: number;
    newFeatures?: string[];
  };
  upcomingFeatures?: string[];
  healthTip?: string;
}

export const generateMonthlyUpdateEmail = (data: MonthlyUpdateData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.month} ${data.year} Health Update</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; }
    .container { max-width: 600px; margin: auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #e9ecef; }
    .month-icon { font-size: 48px; margin-bottom: 15px; }
    h1 { color: #2d3748; font-size: 28px; margin: 0; }
    .subtitle { color: #718096; font-size: 16px; margin-top: 5px; }
    .section { margin: 30px 0; }
    .section-title { color: #4a5568; font-size: 20px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; border-left: 4px solid #4299e1; }
    .stat-number { font-size: 32px; font-weight: bold; color: #2d3748; }
    .stat-label { color: #718096; font-size: 14px; margin-top: 5px; }
    .feature-list { list-style: none; padding: 0; }
    .feature-item { padding: 10px 0; border-bottom: 1px solid #e9ecef; }
    .feature-item:before { content: "✨"; margin-right: 10px; }
    .health-tip { background: #e6fffa; border-left: 4px solid #38b2ac; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #4299e1 0%, #667eea 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .footer { margin-top: 40px; text-align: center; color: #718096; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="month-icon">📅</div>
      <h1>Your ${data.month} Health Update</h1>
      <div class="subtitle">Staying healthy together in ${data.year}</div>
    </div>
    
    <div class="section">
      <h2 class="section-title">Hello, ${data.userName}! 👋</h2>
      <p style="font-size: 16px; line-height: 1.6; color: #4a5568;">
        Welcome to a new month of health and wellness! Here's your personalized update from ${data.appName}.
      </p>
    </div>
    
    ${data.stats ? `
    <div class="section">
      <h2 class="section-title">Your ${data.month} Overview 📊</h2>
      <div class="stats-grid">
        ${data.stats.consultations ? `
        <div class="stat-card">
          <div class="stat-number">${data.stats.consultations}</div>
          <div class="stat-label">Consultations</div>
        </div>
        ` : ''}
        
        <div class="stat-card" style="border-left-color: #48bb78;">
          <div class="stat-number">${data.stats?.healthTips || '5+'}</div>
          <div class="stat-label">Health Tips Viewed</div>
        </div>
        
        <div class="stat-card" style="border-left-color: #ed8936;">
          <div class="stat-number">100%</div>
          <div class="stat-label">Health Commitment</div>
        </div>
      </div>
    </div>
    ` : ''}
    
    ${data.healthTip ? `
    <div class="section">
      <h2 class="section-title">💡 This Month's Health Tip</h2>
      <div class="health-tip">
        <p style="font-size: 16px; line-height: 1.6; color: #2d3748; margin: 0;">${data.healthTip}</p>
      </div>
    </div>
    ` : ''}
    
    ${data.upcomingFeatures?.length ? `
    <div class="section">
      <h2 class="section-title">🚀 Coming Soon</h2>
      <ul class="feature-list">
        ${data.upcomingFeatures.map(feature => `
        <li class="feature-item">${feature}</li>
        `).join('')}
      </ul>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin-top: 40px;">
      <a href="${data.appUrl}/dashboard" class="button">View Your Dashboard</a>
      <p style="margin-top: 15px; font-size: 14px; color: #718096;">
        Track your health journey and book appointments
      </p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
      <p>To customize your notifications, visit your <a href="${data.appUrl}/settings/notifications" style="color: #4299e1;">Notification Settings</a></p>
      <p style="font-size: 12px; margin-top: 10px;">This is an automated monthly update. You're receiving this because you're a valued member of ${data.appName}.</p>
    </div>
  </div>
</body>
</html>
  `;
};