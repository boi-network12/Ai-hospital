import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});



export const careerApplicationEmailTemplates = {
  confirmation: (application: any) => ({
    subject: 'Career Application Received',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Received</h1>
            </div>
            <div class="content">
              <h2>Dear ${application.fullName},</h2>
              <p>Thank you for applying for the <strong>${application.desiredRole}</strong> position.</p>
              <p><strong>Application Details:</strong></p>
              <ul>
                <li><strong>Position:</strong> ${application.desiredRole}</li>
                <li><strong>Specialization:</strong> ${application.specialization}</li>
                <li><strong>Application ID:</strong> ${application._id}</li>
                <li><strong>Date:</strong> ${application.applicationDate.toLocaleDateString()}</li>
              </ul>
              <p>We will review your application and contact you within 5-7 business days.</p>
              <p>Best regards,<br><strong>Healthcare Platform Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
  
  interview: (application: any) => ({
    subject: 'Interview Invitation',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #4CAF50; 
                      color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Interview Invitation</h1>
            </div>
            <div class="content">
              <h2>Dear ${application.fullName},</h2>
              <p>Congratulations! We would like to invite you for an interview.</p>
              <p><strong>Interview Details:</strong></p>
              <ul>
                <li><strong>Date:</strong> ${application.interviewDate?.toLocaleString()}</li>
                <li><strong>Duration:</strong> 30-45 minutes</li>
                <li><strong>Platform:</strong> Zoom</li>
              </ul>
              <p>Please join the meeting using the link below:</p>
              <p><a href="${application.interviewLink}" class="button">Join Interview</a></p>
              ${application.interviewNotes ? 
                `<p><strong>Additional Notes:</strong><br>${application.interviewNotes}</p>` : ''}
              <p>Please ensure you have:</p>
              <ul>
                <li>Stable internet connection</li>
                <li>Webcam and microphone</li>
                <li>Your identification documents</li>
              </ul>
              <p>Best regards,<br><strong>Healthcare Platform Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
  
  approval: (application: any, password: string) => ({
    subject: 'Welcome to Healthcare Platform!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .credentials { background: #fff; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #2196F3; 
                      color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome Aboard!</h1>
            </div>
            <div class="content">
              <h2>Dear ${application.fullName},</h2>
              <p>Congratulations! We are pleased to inform you that your application has been approved.</p>
              <p>Your account has been created on our platform. Here are your login credentials:</p>
              
              <div class="credentials">
                <p><strong>Email:</strong> ${application.email}</p>
                <p><strong>Temporary Password:</strong> ${password}</p>
              </div>
              
              <p><strong>Important Security Notice:</strong><br>
              Please log in immediately and change your password.</p>
              
              <p><a href="${process.env.FRONTEND_URL}/login" class="button">Log In Now</a></p>
              
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Log in with the credentials above</li>
                <li>Complete your profile setup</li>
                <li>Set up your availability schedule</li>
                <li>Review platform policies and guidelines</li>
              </ol>
              
              <p>Best regards,<br><strong>Healthcare Platform Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};