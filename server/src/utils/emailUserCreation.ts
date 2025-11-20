// src/utils/emailUserCreation.ts
import nodemailer from 'nodemailer';
import { UserRole } from '../types/usersDetails';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Sends a welcome email to a newly created user by admin
 * Includes their email and temporary password (in plaintext)
 */
export const sendUserCreationEmail = async (
    to: string,
    name: string,
    role: UserRole,
    temporaryPassword: string
): Promise<void> => {
    const appName = process.env.APP_NAME || 'NeuroMed AI';
    const frontendUrl = process.env.FRONTEND_ORIGIN?.split(',')[0] || 'https://com.neuromed.app';
    const loginUrl = `${frontendUrl}/login`;
    const year = new Date().getFullYear();

    // Capitalize role nicely
    const formattedRole = role.charAt(0).toUpperCase() + role.slice(1);

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Welcome to ${appName}!</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f  bgcolor="#f4f7fa"; padding: 20px; }
          .container { max-width: 600px; margin: 30px auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { text-align025: center; margin-bottom: 30px; }
          .header h1 { color: #2c3e50; font-size: 28px; margin: 0; }
          .badge { display: inline-block; background: #27ae60; color: white; padding: 8px 20px; border-radius: 50px; font-size: 14px; font-weight: bold; margin-top: 10px; }
          .content { line-height: 1.7; color: #34495e; }
          .credentials { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #3498db; }
          .credential-label { font-weight: bold; color: #2c3e50; }
          .password-warning { background: #fef9e7; border: 1px solid #fad76b; color: #e67e22; padding: 15px; border-radius: 8px; font-size: 14px; margin: 20px 0; }
          .btn { display: inline-block; background: #3498db; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { margin-top: 50px; font-size: 12px; color: #95a5a6; text-align: center; }
          a { color: #3498db; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${appName}!</h1>
            <div class="badge">Approved as ${formattedRole}</div>
          </div>

          <div class="content">
            <p>Hi <strong>${name}</strong>,</p>

            <p>Congratulations! Your account has been successfully created and <strong>approved</strong> by the NeuroMed AI administration team.</p>

            <p>You now have access to the platform as a <strong>${formattedRole}</strong>.</p>

            <div class="credentials">
              <p><span class="credential-label">Login Email:</span> <strong>${to}</strong></p>
              <p><span class="credential-label">Temporary Password:</span> 
                <strong style="font-size: 18px; letter-spacing: 1px;">${temporaryPassword}</strong>
              </p>
            </div>

            <div class="password-warning">
              <strong>Security Notice:</strong> This is a temporary password. For your security, you <strong>must change your password</strong> immediately after logging in for the first time.
            </div>

            <p style="text-align: center;">
              <a href="${loginUrl}" class="btn">Log In Now & Change Password</a>
            </p>

            <p>If you did not expect this email or believe this was sent in error, please contact our support team immediately at 
              <a href="mailto:support@neuromed.app">support@neuromed.app</a>
            </p>
          </div>

          <div class="footer">
            <p>© ${year} <a href="${frontendUrl}">${appName}</a>. All rights reserved.</p>
            <p>This is an automated message — please do not reply directly.</p>
          </div>
        </div>
      </body>
    </html>
  `;

    await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to,
        subject: `Your ${appName} Account is Ready – Welcome, ${formattedRole}!`,
        html,
    });
};