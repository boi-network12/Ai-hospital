// src/utils/emailPasswordReset.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendPasswordResetOtpEmail = async (to: string, otp: string): Promise<void> => {
  const appName = process.env.APP_NAME || 'NeuroMed AI';
  const appUrl = process.env.APP_URL || 'https://com.neuromed.app';
  const year = new Date().getFullYear();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { color: #e74c3c; margin: 0; }
          .otp { font-size: 36px; font-weight: bold; letter-spacing: 6px; text-align: center; margin: 30px 0; background: #f8f9fa; padding: 20px; border-radius: 8px; color: #2c3e50; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 14px; }
          .footer { margin-top: 40px; font-size: 12px; color: #7f8c8d; text-align: center; }
          a { color: #3498db; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <p>Hi there,</p>
          <p>We received a request to reset the password for your <strong>${appName}</strong> account:</p>
          <p style="font-size: 18px; margin: 20px 0;"><strong>${to}</strong></p>

          <div class="otp">${otp}</div>

          <p>This code expires in <strong>5 minutes</strong> and can only be used once.</p>

          <div class="warning">
            <strong>Didn't request this?</strong> Ignore this email or contact support immediately. 
            Someone may be trying to access your account.
          </div>

          <p>If you did request this, use the code above to set a new password.</p>

          <div class="footer">
            © ${year} <a href="${appUrl}">${appName}</a>. All rights reserved.<br/>
            This is an automated message — please do not reply.
          </div>
        </div>
      </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject: `🔐 Reset Your ${appName} Password`,
    html,
  });
};