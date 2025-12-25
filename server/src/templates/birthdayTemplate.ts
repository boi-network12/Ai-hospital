export const generateBirthdayEmail = (userName: string, appName: string, appUrl: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Happy Birthday! 🎂</title>
  <style>
    body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; }
    .container { max-width: 600px; margin: auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .header { text-align: center; padding: 20px 0; }
    .birthday-icon { font-size: 60px; margin-bottom: 20px; }
    h1 { color: #d63384; font-size: 32px; margin: 0; }
    .message { font-size: 18px; line-height: 1.6; color: #555; margin: 30px 0; }
    .birthday-offer { background: #fff0f6; border-left: 4px solid #d63384; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 20px; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 14px; }
    .special { color: #d63384; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="birthday-icon">🎂🎈🎁</div>
      <h1>Happy Birthday, ${userName}! 🎉</h1>
    </div>
    
    <div class="message">
      <p>Wishing you a day filled with joy, good health, and happiness!</p>
      <p>On your special day, we want to thank you for being a valued member of the ${appName} community.</p>
      
      <div class="birthday-offer">
        <p><strong>🎁 Birthday Special Offer!</strong></p>
        <p>As our birthday gift to you, enjoy <span class="special">15% OFF</span> on all consultations booked today!</p>
        <p>Use code: <strong>BIRTHDAY2024</strong></p>
      </div>
      
      <p>May this year bring you abundant health, success in all your endeavors, and peace of mind.</p>
      <p>With warmest wishes,<br>The ${appName} Team</p>
    </div>
    
    <div style="text-align: center;">
      <a href="${appUrl}/book-now" class="button">Book a Consultation Now</a>
      <p style="margin-top: 15px; font-size: 14px; color: #666;">(Offer valid for 24 hours)</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      <p>This email was sent to celebrate your special day!</p>
      <p><a href="${appUrl}/notification-settings" style="color: #999;">Manage notification preferences</a></p>
    </div>
  </div>
</body>
</html>
  `;
};