export interface HolidayTemplateData {
  holidayName: string;
  userName: string;
  appName: string;
  appUrl: string;
  date: string;
  holidayIcon?: string;
  specialNote?: string;
  operatingHours?: string;
}

export const generateHolidayEmail = (data: HolidayTemplateData) => {
  const icons = {
    christmas: "🎄🎅",
    newyear: "🎆🎊",
    eid: "🕌🌙",
    diwali: "🪔✨",
    thanksgiving: "🦃🍂",
    boxingday: "🎁📦",
    default: "🎉"
  };

  const getIcon = () => {
    const name = data.holidayName.toLowerCase();
    if (name.includes('christmas')) return icons.christmas;
    if (name.includes('new year')) return icons.newyear;
    if (name.includes('eid') || name.includes('salah')) return icons.eid;
    if (name.includes('diwali')) return icons.diwali;
    if (name.includes('thanksgiving')) return icons.thanksgiving;
    if (name.includes('boxing')) return icons.boxingday;
    return icons.default;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.holidayName} Greetings</title>
  <style>
    body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; }
    .container { max-width: 600px; margin: auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .header { text-align: center; padding: 20px 0; }
    .holiday-icon { font-size: 60px; margin-bottom: 20px; }
    h1 { color: #4a5568; font-size: 32px; margin: 0; }
    .subtitle { color: #718096; font-size: 18px; margin: 10px 0 30px; }
    .message { font-size: 16px; line-height: 1.6; color: #555; margin: 30px 0; }
    .notice-box { background: #f7fafc; border: 2px dashed #cbd5e0; padding: 20px; margin: 30px 0; border-radius: 8px; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 14px; }
    .highlight { color: #2d3748; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="holiday-icon">${getIcon()}</div>
      <h1>Happy ${data.holidayName}!</h1>
      <div class="subtitle">${data.date}</div>
    </div>
    
    <div class="message">
      <p>Dear ${data.userName},</p>
      <p>Wishing you and your family a joyful and peaceful ${data.holidayName} celebration!</p>
      
      ${data.specialNote ? `<p style="color: #2d3748; font-style: italic;">${data.specialNote}</p>` : ''}
      
      <div class="notice-box">
        <p><strong>📢 Service Notice:</strong></p>
        <p>${data.operatingHours || 'Our services will continue to be available 24/7 during the holidays.'}</p>
        <p>For emergencies, please use our <span class="highlight">Emergency Consultation</span> feature in the app.</p>
      </div>
      
      <p>May this festive season bring you renewed energy, good health, and happiness!</p>
      <p>Warm regards,<br>The ${data.appName} Team</p>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${data.appUrl}/emergency" class="button">Emergency Services</a>
      <p style="margin-top: 15px; font-size: 14px; color: #666;">Available 24/7</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${data.appName}. All rights reserved.</p>
      <p>${data.appName} wishes you a safe and healthy celebration!</p>
    </div>
  </div>
</body>
</html>
  `;
};