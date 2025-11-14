// src/utils/email.ts
import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
  const appName = process.env.APP_NAME || 'MyApp';
  const appUrl = process.env.APP_URL || '#';
  const year = new Date().getFullYear();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Your OTP</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .otp { font-size: 32px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 20px 0; color: #2c3e50; }
          .footer { margin-top: 40px; font-size: 12px; color: #7f8c8d; text-align: center; }
          a { color: #3498db; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Hi there,</h2>
          <p>Your one-time password (OTP) for registering with <strong>${appName}</strong> is:</p>
          <div class="otp">${otp}</div>
          <p>This code expires in 10 minutes. Do not share it with anyone.</p>
          <p>If you didn’t request this, you can safely ignore this email.</p>
          <div class="footer">
            © ${year} <a href="${appUrl}">${appName}</a>. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject: `Your OTP for ${appName}`,
    html,
  });
};