import nodemailer from 'nodemailer';
import { format } from 'date-fns';

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter
transporter.verify((error: any) => {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('Email service ready');
  }
});

// Types for appointment data
export interface AppointmentEmailData {
  appointmentId: string;
  date: Date;
  duration: number;
  type: 'physical' | 'virtual';
  notes?: string;
  patientName: string;
  patientEmail?: string;
  professionalName: string;
  professionalEmail?: string;
  status: 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  oldStatus?: string;
  rescheduleDate?: Date;
  actionUrl?: string;
}

// Base styling for all emails
const getBaseStyles = () => `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    min-height: 100vh;
  }
  
  .email-container {
    max-width: 600px;
    margin: 40px auto;
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  }
  
  .email-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    text-align: center;
  }
  
  .app-logo {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 1px;
    margin-bottom: 10px;
  }
  
  .status-badge {
    display: inline-block;
    padding: 8px 20px;
    background: rgba(255,255,255,0.2);
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-top: 10px;
  }
  
  .email-content {
    padding: 40px;
  }
  
  .section {
    margin-bottom: 30px;
  }
  
  .section-title {
    color: #2d3748;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .info-item {
    display: flex;
    align-items: center;
    padding: 15px;
    background: #f7fafc;
    border-radius: 10px;
    transition: all 0.3s ease;
  }
  
  .info-item:hover {
    background: #edf2f7;
    transform: translateY(-2px);
  }
  
  .info-icon {
    width: 40px;
    height: 40px;
    background: #e6fffa;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    color: #319795;
    font-size: 20px;
  }
  
  .info-details {
    flex: 1;
  }
  
  .info-label {
    color: #718096;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .info-value {
    color: #2d3748;
    font-size: 15px;
    font-weight: 600;
  }
  
  .status-message {
    background: #f0f9ff;
    border-left: 4px solid #3b82f6;
    padding: 20px;
    border-radius: 8px;
    margin: 30px 0;
  }
  
  .action-button {
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 32px;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 16px;
    text-align: center;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  
  .action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }
  
  .email-footer {
    background: #f7fafc;
    padding: 20px;
    text-align: center;
    border-top: 1px solid #e2e8f0;
  }
  
  .footer-text {
    color: #718096;
    font-size: 12px;
    line-height: 1.6;
  }
  
  .footer-links {
    margin-top: 10px;
  }
  
  .footer-link {
    color: #667eea;
    text-decoration: none;
    margin: 0 10px;
    font-size: 12px;
  }
  
  @media (max-width: 600px) {
    .email-container {
      margin: 20px;
      border-radius: 15px;
    }
    
    .email-content {
      padding: 25px;
    }
    
    .email-header {
      padding: 25px;
    }
  }
`;

// Status-specific configurations
const getStatusConfig = (status: string) => {
  const configs = {
    confirmed: {
      title: 'Appointment Confirmed! 🎉',
      color: '#10b981',
      icon: '✅',
      bgColor: '#d1fae5',
      message: 'Your appointment has been confirmed and is scheduled.',
      actionText: 'View Appointment Details'
    },
    completed: {
      title: 'Appointment Completed! ✅',
      color: '#3b82f6',
      icon: '🏁',
      bgColor: '#dbeafe',
      message: 'Your appointment has been marked as completed.',
      actionText: 'View Summary'
    },
    cancelled: {
      title: 'Appointment Cancelled',
      color: '#ef4444',
      icon: '❌',
      bgColor: '#fee2e2',
      message: 'This appointment has been cancelled.',
      actionText: 'Schedule New Appointment'
    },
    rejected: {
      title: 'Appointment Request Declined',
      color: '#f59e0b',
      icon: '⚠️',
      bgColor: '#fef3c7',
      message: 'Your appointment request was not accepted.',
      actionText: 'Find Another Professional'
    }
  };
  
  return configs[status as keyof typeof configs] || configs.confirmed;
};

// Format date for display
const formatDateDisplay = (date: Date) => {
  return {
    date: format(date, 'EEEE, MMMM do, yyyy'),
    time: format(date, 'h:mm a'),
    datetime: format(date, "yyyy-MM-dd'T'HH:mm:ss")
  };
};

// Generate email HTML
export const generateAppointmentEmail = (data: AppointmentEmailData): string => {
  const config = getStatusConfig(data.status);
  const formattedDate = formatDateDisplay(data.date);
  const appName = process.env.APP_NAME || 'HealthConnect';
  const appUrl = process.env.APP_URL || 'https://healthconnect.com';
  const dashboardUrl = `${appUrl}/dashboard`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Update - ${appName}</title>
    <style>${getBaseStyles()}</style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="app-logo">${appName}</div>
            <h1 style="margin: 20px 0 10px 0; font-size: 28px;">${config.title}</h1>
            <div class="status-badge" style="background: ${config.bgColor}; color: ${config.color};">
                ${config.icon} ${data.status.toUpperCase()}
            </div>
        </div>
        
        <div class="email-content">
            <div class="section">
                <div class="section-title">Appointment Details</div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-icon">📅</div>
                        <div class="info-details">
                            <div class="info-label">Date & Time</div>
                            <div class="info-value">${formattedDate.date} at ${formattedDate.time}</div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-icon">⏱️</div>
                        <div class="info-details">
                            <div class="info-label">Duration</div>
                            <div class="info-value">${data.duration} minutes</div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-icon">🏥</div>
                        <div class="info-details">
                            <div class="info-label">Appointment Type</div>
                            <div class="info-value">${data.type === 'physical' ? 'In-Person Consultation' : 'Virtual Session'}</div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <div class="info-icon">👤</div>
                        <div class="info-details">
                            <div class="info-label">${data.patientEmail ? 'Professional' : 'Patient'}</div>
                            <div class="info-value">${data.patientEmail ? data.professionalName : data.patientName}</div>
                        </div>
                    </div>
                    
                    ${data.notes ? `
                    <div class="info-item">
                        <div class="info-icon">📝</div>
                        <div class="info-details">
                            <div class="info-label">Notes</div>
                            <div class="info-value">${data.notes}</div>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${data.rescheduleDate ? `
                    <div class="info-item" style="background: #e6fffa;">
                        <div class="info-icon">🔄</div>
                        <div class="info-details">
                            <div class="info-label">Rescheduled To</div>
                            <div class="info-value">
                                ${format(data.rescheduleDate, 'EEEE, MMMM do, yyyy')} at ${format(data.rescheduleDate, 'h:mm a')}
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="status-message">
                <p style="margin: 0; color: #2d3748; font-size: 16px; line-height: 1.6;">
                    ${config.message} ${data.oldStatus ? `(Previously: ${data.oldStatus})` : ''}
                </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="${data.actionUrl || dashboardUrl}" class="action-button">
                    ${config.actionText}
                </a>
            </div>
            
            ${data.status === 'completed' ? `
            <div style="background: #f7fafc; padding: 20px; border-radius: 12px; text-align: center; margin-top: 30px;">
                <p style="color: #4a5568; margin-bottom: 15px; font-size: 14px;">
                    How was your experience with ${data.patientEmail ? data.professionalName : 'this appointment'}?
                </p>
                <a href="${appUrl}/rate/${data.appointmentId}" 
                   style="display: inline-block; padding: 10px 20px; background: #48bb78; color: white; 
                          text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                    Share Your Feedback
                </a>
            </div>
            ` : ''}
        </div>
        
        <div class="email-footer">
            <div class="footer-text">
                This is an automated message from ${appName}.<br>
                Appointment ID: ${data.appointmentId}<br>
                Sent on ${format(new Date(), 'MMMM do, yyyy h:mm a')}
            </div>
            <div class="footer-links">
                <a href="${dashboardUrl}" class="footer-link">Dashboard</a>
                <a href="${appUrl}/support" class="footer-link">Support</a>
                <a href="${appUrl}/privacy" class="footer-link">Privacy</a>
                <a href="${appUrl}/unsubscribe" class="footer-link">Unsubscribe</a>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

// Send appointment status email
export const sendAppointmentStatusEmail = async (
  recipientEmail: string,
  recipientName: string,
  data: AppointmentEmailData
): Promise<void> => {
  const appName = process.env.APP_NAME || 'HealthConnect';
  const config = getStatusConfig(data.status);
  
  const html = generateAppointmentEmail({
    ...data,
    patientEmail: recipientEmail === data.patientEmail ? recipientEmail : undefined,
    professionalEmail: recipientEmail === data.professionalEmail ? recipientEmail : undefined
  });

  const mailOptions = {
    from: `"${appName} Notifications" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: `Appointment ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}: ${recipientName}`,
    html,
    headers: {
      'X-Appointment-ID': data.appointmentId,
      'X-Appointment-Status': data.status,
      'X-Priority': '1',
    }
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Appointment status email sent to ${recipientEmail} for appointment ${data.appointmentId}`);
  } catch (error: any) {
    console.error('Failed to send appointment status email:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }
};

// Send email to both patient and professional
export const notifyBothParties = async (
  appointmentData: AppointmentEmailData
): Promise<void> => {
  try {
    const promises = [];
    
    // Send to patient if email exists
    if (appointmentData.patientEmail) {
      promises.push(
        sendAppointmentStatusEmail(
          appointmentData.patientEmail,
          appointmentData.patientName,
          {
            ...appointmentData,
            actionUrl: `${process.env.APP_URL}/bookings/${appointmentData.appointmentId}`
          }
        )
      );
    }
    
    // Send to professional if email exists
    if (appointmentData.professionalEmail) {
      promises.push(
        sendAppointmentStatusEmail(
          appointmentData.professionalEmail,
          appointmentData.professionalName,
          {
            ...appointmentData,
            actionUrl: `${process.env.APP_URL}/appointments/${appointmentData.appointmentId}`
          }
        )
      );
    }
    
    await Promise.all(promises);
    console.log(`Notifications sent for appointment ${appointmentData.appointmentId}`);
  } catch (error: any) {
    console.error('Failed to send notifications:', error);
    // Don't throw - we don't want to fail the appointment update
  }
};