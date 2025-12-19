import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});


// Optional: Verify transporter on startup (good for debugging)
transporter.verify((error: any) => {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('Email transporter ready');
  }
});

/**
 * Sends a professional booking request email to the healthcare professional
 */
export const sendBookingRequestEmail = async (
  to: string,
  patientName: string,
  date: Date,
  duration: number
): Promise<void> => {
  const appName = process.env.APP_NAME || 'HealthConnect';
  const appUrl = process.env.APP_URL || 'https://yourapp.com';

  const formattedDate = date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>New Physical Consultation Request</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px; }
          .container { max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          h2 { color: #2c3e50; }
          .info { margin: 20px 0; line-height: 1.8; }
          .label { font-weight: bold; color: #34495e; }
          .button {
            display: inline-block;
            background: #8089ff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin-top: 20px;
          }
          .footer { margin-top: 40px; font-size: 12px; color: #95a5a6; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>New Physical Consultation Request</h2>
          <div class="info">
            <p>You have received a new in-person consultation request:</p>
            <p><span class="label">Patient:</span> ${patientName}</p>
            <p><span class="label">Date & Time:</span> ${formattedDate}</p>
            <p><span class="label">Duration:</span> ${duration} minutes</p>
          </div>
          <p>Please log in to your dashboard to <strong>accept</strong> or <strong>decline</strong> this request.</p>
          <a href="${appUrl}/appointments" class="button">View in Dashboard</a>
          <div class="footer">
            © ${new Date().getFullYear()} ${appName}. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || appName}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject: `New Physical Booking Request from ${patientName}`,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Booking request email sent to ${to}`);
  } catch (error: any) {
    console.error('Failed to send booking request email:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }
};