import nodemailer from 'nodemailer';
import CareerApplication from '../models/CareerApplicationModel';
import User from '../models/UserModel';
import { adminCreateUser } from './adminService';
import { Types } from 'mongoose';
import { IHealthcareCertification } from '../types/usersDetails';

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email templates
const careerApplicationEmailTemplates = {
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

  statusUpdate: (application: any) => ({
    subject: `Application Status Update: ${application.status.replace('_', ' ').toUpperCase()}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .status { padding: 15px; background: #fff; border-left: 4px solid #FF9800; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Status Update</h1>
            </div>
            <div class="content">
              <h2>Dear ${application.fullName},</h2>
              <p>Your application status has been updated:</p>
              
              <div class="status">
                <h3>New Status: ${application.status.replace('_', ' ').toUpperCase()}</h3>
                ${application.notes ? `<p><strong>Notes from the team:</strong><br>${application.notes}</p>` : ''}
              </div>
              
              <p><strong>Application Details:</strong></p>
              <ul>
                <li><strong>Position:</strong> ${application.desiredRole}</li>
                <li><strong>Application ID:</strong> ${application._id}</li>
                <li><strong>Last Updated:</strong> ${new Date(application.lastUpdated).toLocaleDateString()}</li>
              </ul>
              
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
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

  adminNotification: (application: any) => ({
    subject: 'New Career Application Received',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #9C27B0; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #2196F3; 
                      color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Application Alert</h1>
            </div>
            <div class="content">
              <h2>New Career Application Submitted</h2>
              <p>A new application requires your attention:</p>
              
              <p><strong>Applicant Details:</strong></p>
              <ul>
                <li><strong>Name:</strong> ${application.fullName}</li>
                <li><strong>Email:</strong> ${application.email}</li>
                <li><strong>Phone:</strong> ${application.phoneNumber}</li>
                <li><strong>Position:</strong> ${application.desiredRole}</li>
                <li><strong>Specialization:</strong> ${application.specialization}</li>
                <li><strong>Experience:</strong> ${application.yearsOfExperience} years</li>
              </ul>
              
              <p><strong>Application Submitted:</strong> ${application.applicationDate.toLocaleDateString()}</p>
              
              <p>Please review this application as soon as possible.</p>
              
              <a href="${process.env.ADMIN_URL}/career/applications/${application._id}" class="button">
                Review Application
              </a>
              
              <p>Best regards,<br><strong>Healthcare Platform System</strong></p>
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

// Helper function to send emails
const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const mailOptions = {
      from: `"Healthcare Platform" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email notification');
  }
};

export interface CareerApplicationData {
  // Personal Information
  email: string;
  phoneNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  country: string;
  state: string;
  city: string;
  postalCode?: string;
  address?: string;
  
  // Role Application
  desiredRole: 'nurse' | 'doctor' | 'hospital';
  specialization: string;
  yearsOfExperience: number;
  currentPosition?: string;
  currentEmployer?: string;
  
  // Documents
  resumeUrl: string;
  profilePictureUrl: string;
  licenseDocumentUrl?: string;
  certificates?: Array<{
    name: string;
    url: string;
    issuedDate: string;
    expiryDate?: string;
    issuingAuthority?: string;
    licenseNumber?: string;
    licenseType?: string;
  }>;
  
  // Application Details
  coverLetter?: string;
  expectedSalary?: number;
  availableStartDate?: string;
  preferredLocations: string[];
  willingToRelocate?: boolean;
  
  // Metadata
  ipAddress?: string;
  source?: string;
  privacyConsent: boolean;
  termsAccepted: boolean;
}


/* ---------- Submit career application ---------- */
export const submitCareerApplication = async (data: CareerApplicationData) => {
  // Check for existing application with same email
  const existing = await CareerApplication.findOne({ 
    email: data.email,
    status: { $in: ['pending', 'under_review', 'interview_scheduled'] }
  });
  
  if (existing) {
    throw new Error('You already have an active application. Please wait for our response.');
  }

  // Validate required documents
  if (!data.resumeUrl || !data.profilePictureUrl) {
    throw new Error('Resume and profile picture are required');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new Error('An account with this email already exists. Please log in to apply.');
  }

  // Validate required fields
  if (!data.fullName || !data.email || !data.phoneNumber || !data.dateOfBirth || 
      !data.gender || !data.desiredRole || !data.specialization) {
    throw new Error('All required fields must be filled');
  }

  if (!data.country || !data.state || !data.city) {
    throw new Error('Country, state, and city are required');
  }

  // Validate consent
  if (!data.privacyConsent || !data.termsAccepted) {
    throw new Error('You must accept the privacy policy and terms of service');
  }

  // Validate date of birth
  const dobDate = new Date(data.dateOfBirth);
  if (isNaN(dobDate.getTime())) {
    throw new Error('Invalid date of birth format');
  }

  // Extract Cloudinary URLs if they're objects
  const processedData: any = { ...data };
  
  // Handle resumeUrl (could be object or string)
  if (typeof processedData.resumeUrl === 'object' && processedData.resumeUrl.secure_url) {
    processedData.resumeUrl = processedData.resumeUrl.secure_url;
  }
  
  // Handle profilePictureUrl (could be object or string)
  if (typeof processedData.profilePictureUrl === 'object' && processedData.profilePictureUrl.secure_url) {
    processedData.profilePictureUrl = processedData.profilePictureUrl.secure_url;
  }
  
  // Handle licenseDocumentUrl if exists
  if (processedData.licenseDocumentUrl && 
      typeof processedData.licenseDocumentUrl === 'object' && 
      processedData.licenseDocumentUrl.secure_url) {
    processedData.licenseDocumentUrl = processedData.licenseDocumentUrl.secure_url;
  }

  // Process certificate URLs if they exist
  if (processedData.certificates && Array.isArray(processedData.certificates)) {
    processedData.certificates = processedData.certificates.map((cert: any) => ({
      ...cert,
      url: typeof cert.url === 'object' && cert.url.secure_url ? cert.url.secure_url : cert.url,
      issuedDate: new Date(cert.issuedDate),
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
      issuingAuthority: cert.issuingAuthority,
      licenseNumber: cert.licenseNumber,
      licenseType: cert.licenseType,
    }));
  }

  // Parse numeric fields
  if (processedData.yearsOfExperience) {
    processedData.yearsOfExperience = parseInt(String(processedData.yearsOfExperience), 10);
  }
  
  if (processedData.expectedSalary) {
    processedData.expectedSalary = parseFloat(String(processedData.expectedSalary));
  }

  // Convert string booleans to actual booleans
  if (typeof processedData.privacyConsent === 'string') {
    processedData.privacyConsent = processedData.privacyConsent === 'true';
  }
  
  if (typeof processedData.termsAccepted === 'string') {
    processedData.termsAccepted = processedData.termsAccepted === 'true';
  }
  
  if (typeof processedData.willingToRelocate === 'string') {
    processedData.willingToRelocate = processedData.willingToRelocate === 'true';
  }

  // Set default values
  if (!processedData.preferredLocations || !Array.isArray(processedData.preferredLocations)) {
    processedData.preferredLocations = [];
  }
  
  if (!processedData.certificates) {
    processedData.certificates = [];
  }

  // Create application
  const application = new CareerApplication({
    ...processedData,
    dateOfBirth: dobDate.toISOString(), // Save as ISO string
    availableStartDate: processedData.availableStartDate ? new Date(processedData.availableStartDate) : undefined,
    // Don't process certificates here - already processed above
    status: 'pending',
    applicationDate: new Date(),
    lastUpdated: new Date(),
  });

  await application.save();

  // Send confirmation email to applicant using template
  await sendApplicationConfirmationEmail(application);

  // Send notification to admin using template
  await notifyAdminsNewApplication(application);

  return application;
};

/* ---------- Get all applications (admin) ---------- */
export const getAllApplications = async (filters: {
  status?: string;
  desiredRole?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const { status, desiredRole, search, page = 1, limit = 20 } = filters;
  
  const query: any = {};
  
  if (status) query.status = status;
  if (desiredRole) query.desiredRole = desiredRole;
  if (search) {
    query.$or = [
      { fullName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phoneNumber: new RegExp(search, 'i') },
      { specialization: new RegExp(search, 'i') },
    ];
  }

  const applications = await CareerApplication.find(query)
    .sort({ applicationDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('assignedAdmin', 'name email avatar')
    .populate('reviewedBy', 'name email avatar')
    .populate('createdUserId', 'name email role')
    .lean();

  const total = await CareerApplication.countDocuments(query);
  
  return {
    applications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/* ---------- Get single application ---------- */
export const getApplicationById = async (id: string) => {
  const application = await CareerApplication.findById(id)
    .populate('assignedAdmin', 'name email avatar phoneNumber')
    .populate('reviewedBy', 'name email avatar phoneNumber')
    .populate('createdUserId', 'name email role phoneNumber createdAt');
  
  if (!application) {
    throw new Error('Application not found');
  }
  
  return application;
};

/* ---------- Update application status ---------- */
export const updateApplicationStatus = async (
  applicationId: string,
  status: string,
  adminId: string,
  notes?: string
) => {
  const application = await CareerApplication.findById(applicationId);
  if (!application) throw new Error('Application not found');

  const updateData: any = {
    status,
    reviewedBy: new Types.ObjectId(adminId),
    reviewedAt: new Date(),
    lastUpdated: new Date(),
  };

  if (notes) updateData.notes = notes;

  if (status === 'under_review') {
    updateData.assignedAdmin = new Types.ObjectId(adminId);
  }

  if (status === 'rejected' && notes) {
    updateData.rejectionReason = notes;
  }

  const updated = await CareerApplication.findByIdAndUpdate(
    applicationId,
    { $set: updateData },
    { new: true }
  ).populate('reviewedBy', 'name email');

  // Send status update email using template
  await sendApplicationStatusEmail(updated!);

  return updated;
};

/* ---------- Schedule interview ---------- */
export const scheduleInterview = async (
  applicationId: string,
  interviewDate: Date,
  interviewLink: string,
  adminId: string,
  notes?: string
) => {
  const application = await CareerApplication.findById(applicationId);
  if (!application) throw new Error('Application not found');

  const updateData = {
    status: 'interview_scheduled' as const,
    interviewDate,
    interviewLink,
    interviewNotes: notes,
    assignedAdmin: new Types.ObjectId(adminId),
    reviewedBy: new Types.ObjectId(adminId),
    reviewedAt: new Date(),
    lastUpdated: new Date(),
  };

  const updated = await CareerApplication.findByIdAndUpdate(
    applicationId,
    { $set: updateData },
    { new: true }
  ).populate('assignedAdmin', 'name email');

  // Send interview invitation email using template
  await sendInterviewInvitationEmail(updated!);

  return updated;
};

/* ---------- Approve application and create user ---------- */
export const approveApplicationAndCreateUser = async (
  applicationId: string,
  adminId: string,
  password: string, // Temporary password for the new user
  additionalNotes?: string
) => {
  const application = await CareerApplication.findById(applicationId)
    .populate('certificates');
  
  if (!application) throw new Error('Application not found');

  if (application.status !== 'interview_scheduled' && application.status !== 'under_review') {
    throw new Error('Application must be interviewed or under review before approval');
  }

  // Check if user already created
  if (application.createdUserId) {
    throw new Error('User account already created for this application');
  }

  // Prepare certifications from application
  const certifications: IHealthcareCertification[] = (application.certificates || []).map(cert => ({
    name: cert.name,
    issuingAuthority: '',
    certificateUrl: cert.url,
    issueDate: cert.issuedDate,
    expiryDate: cert.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year if no expiry
    licenseNumber: cert.licenseNumber || '',
    licenseType: cert.licenseType || '',
    verificationStatus: 'verified' as const,
    verifiedBy: new Types.ObjectId(adminId),
    verifiedAt: new Date(),
    notes: 'Automatically verified from career application',
  }));

  // Parse date of birth from string to Date object
  let dateOfBirth: Date;
  if (typeof application.dateOfBirth === 'string') {
    dateOfBirth = new Date(application.dateOfBirth);
  } else {
    dateOfBirth = application.dateOfBirth;
  }

  // Validate date
  if (isNaN(dateOfBirth.getTime())) {
    throw new Error('Invalid date of birth in application');
  }

  // Create user account
  const userData = {
    email: application.email,
    password: password,
    name: application.fullName,
    phoneNumber: application.phoneNumber,
    role: application.desiredRole,
    gender: application.gender,
    dateOfBirth: dateOfBirth.toISOString().split('T')[0], // Format as YYYY-MM-DD
    location: {
      country: application.country,
      state: application.state,
      city: application.city,
      address: application.address || '',
      postalCode: application.postalCode || '',
      // For coordinates, you might want to add a geocoding service here
      coordinates: {
        type: 'Point',
        coordinates: [0, 0] // Default coordinates, can be updated later
      }
    },
    specialization: application.specialization,
    licenseNumber: application.licenseDocumentUrl ? 'TO_BE_VERIFIED' : '',
    issuedCountry: application.country,
  };

  try {
    // Create user using admin service
    const user = await adminCreateUser(userData);

    // Update application with created user
    application.status = 'approved';
    application.createdUserId = new Types.ObjectId(String(user._id));
    application.accountCreatedAt = new Date();
    application.reviewedBy = new Types.ObjectId(adminId);
    application.reviewedAt = new Date();
    application.notes = additionalNotes || application.notes;
    application.lastUpdated = new Date();

    // Update user with certifications and profile picture
    await User.findByIdAndUpdate(user._id, {
      $set: {
        'profile.avatar': application.profilePictureUrl,
        'healthcareProfile.certifications': certifications,
        'roleStatus.verifiedLicense': !!application.licenseDocumentUrl,
        'roleStatus.licenseNumber': application.licenseDocumentUrl ? 'TO_BE_VERIFIED' : '',
        'roleStatus.issuedCountry': application.country,
        'profile.gender': application.gender,
        'profile.dateOfBirth': dateOfBirth,
        'profile.bio': application.coverLetter || '',
        'healthcareProfile.bio': application.coverLetter || '',
        'healthcareProfile.hourlyRate': application.expectedSalary 
          ? Math.round(application.expectedSalary / 160) 
          : 50, // Convert annual to hourly (approx)
        'healthcareProfile.yearsOfExperience': application.yearsOfExperience,
        'roleStatus.isActive': true,
        'roleStatus.approvedByAdmin': true,
        'roleStatus.approvalDate': new Date(),
      },
    });

    await application.save();

    // Send approval and welcome email using template
    await sendApplicationApprovalEmail(application, password);

    return {
      application,
      user,
    };
  } catch (error: any) {
    console.error('Error creating user from application:', error);
    
    // If user creation fails, revert application status
    application.status = 'under_review';
    application.notes = `Failed to create user: ${error.message}`;
    application.lastUpdated = new Date();
    await application.save();
    
    throw new Error(`Failed to create user account: ${error.message}`);
  }
};

/* ---------- Assign application to admin ---------- */
export const assignApplicationToAdmin = async (
  applicationId: string,
  adminId: string
) => {
  const application = await CareerApplication.findByIdAndUpdate(
    applicationId,
    {
      $set: {
        assignedAdmin: new Types.ObjectId(adminId),
        status: 'under_review',
        lastUpdated: new Date(),
      },
    },
    { new: true }
  ).populate('assignedAdmin', 'name email');

  if (!application) throw new Error('Application not found');

  // Notify the assigned admin
  const admin = await User.findById(adminId);
  if (admin) {
    const emailTemplate = {
      subject: 'New Application Assigned to You',
      html: `
        <h2>New Application Assignment</h2>
        <p>Dear ${admin.name},</p>
        <p>A new career application has been assigned to you for review:</p>
        <ul>
          <li><strong>Applicant:</strong> ${application.fullName}</li>
          <li><strong>Position:</strong> ${application.desiredRole}</li>
          <li><strong>Specialization:</strong> ${application.specialization}</li>
        </ul>
        <p>Please review this application as soon as possible.</p>
        <p>Best regards,<br>Healthcare Platform Team</p>
      `,
    };
    await sendEmail(admin.email, emailTemplate.subject, emailTemplate.html);
  }

  return application;
};

/* ---------- Get application statistics ---------- */
export const getApplicationStatistics = async () => {
  // Get counts by status
  const stats = await CareerApplication.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$count' },
        byStatus: {
          $push: {
            status: '$_id',
            count: '$count',
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        total: 1,
        byStatus: 1,
      },
    },
  ]);

  // Get counts by role
  const byRole = await CareerApplication.aggregate([
    {
      $group: {
        _id: '$desiredRole',
        count: { $sum: 1 },
      },
    },
  ]);

  // Get recent applications (last 30 days)
  const recentApplications = await CareerApplication.countDocuments({
    applicationDate: {
      $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Get pending review count
  const pendingReview = await CareerApplication.countDocuments({
    status: { $in: ['pending', 'under_review'] },
  });

  // Get interview scheduled count
  const interviewScheduled = await CareerApplication.countDocuments({
    status: 'interview_scheduled',
  });

  // Get average processing time for approved applications
  const processingTimes = await CareerApplication.aggregate([
    {
      $match: {
        status: 'approved',
        accountCreatedAt: { $exists: true },
      },
    },
    {
      $project: {
        processingTime: {
          $divide: [
            { $subtract: ['$accountCreatedAt', '$applicationDate'] },
            1000 * 60 * 60 * 24, // Convert to days
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgProcessingTime: { $avg: '$processingTime' },
        minProcessingTime: { $min: '$processingTime' },
        maxProcessingTime: { $max: '$processingTime' },
      },
    },
  ]);

  return {
    ...stats[0],
    byRole: byRole.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {} as Record<string, number>),
    recentApplications,
    pendingReview,
    interviewScheduled,
    processingStats: processingTimes[0] || {
      avgProcessingTime: 0,
      minProcessingTime: 0,
      maxProcessingTime: 0,
    },
  };
};

/* ---------- Search applications ---------- */
export const searchApplications = async (searchTerm: string, filters: any = {}) => {
  const query: any = {
    $or: [
      { fullName: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { phoneNumber: { $regex: searchTerm, $options: 'i' } },
      { specialization: { $regex: searchTerm, $options: 'i' } },
      { 'preferredLocations': { $regex: searchTerm, $options: 'i' } },
    ],
  };

  // Apply additional filters
  if (filters.status) query.status = filters.status;
  if (filters.desiredRole) query.desiredRole = filters.desiredRole;
  if (filters.startDate) {
    query.applicationDate = { ...query.applicationDate, $gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    query.applicationDate = { ...query.applicationDate, $lte: new Date(filters.endDate) };
  }

  const applications = await CareerApplication.find(query)
    .sort({ applicationDate: -1 })
    .limit(50)
    .populate('assignedAdmin', 'name email')
    .populate('reviewedBy', 'name email')
    .lean();

  return applications;
};

/* ---------- Update application notes ---------- */
export const updateApplicationNotes = async (
  applicationId: string,
  notes: string,
  adminId: string
) => {
  const application = await CareerApplication.findByIdAndUpdate(
    applicationId,
    {
      $set: {
        notes,
        lastUpdated: new Date(),
      },
      $push: {
        // You might want to add a notes history array
        notesHistory: {
          note: notes,
          addedBy: new Types.ObjectId(adminId),
          addedAt: new Date(),
        },
      },
    },
    { new: true }
  ).populate('assignedAdmin reviewedBy', 'name email');

  if (!application) throw new Error('Application not found');

  return application;
};

/* ---------- Email Helper Functions (using templates) ---------- */
const sendApplicationConfirmationEmail = async (application: any) => {
  const template = careerApplicationEmailTemplates.confirmation(application);
  await sendEmail(application.email, template.subject, template.html);
};

const sendApplicationStatusEmail = async (application: any) => {
  const template = careerApplicationEmailTemplates.statusUpdate(application);
  await sendEmail(application.email, template.subject, template.html);
};

const sendInterviewInvitationEmail = async (application: any) => {
  const template = careerApplicationEmailTemplates.interview(application);
  await sendEmail(application.email, template.subject, template.html);
};

const sendApplicationApprovalEmail = async (application: any, password: string) => {
  const template = careerApplicationEmailTemplates.approval(application, password);
  await sendEmail(application.email, template.subject, template.html);
};

const notifyAdminsNewApplication = async (application: any) => {
  const admins = await User.find({ 
    role: 'admin', 
    isDeleted: false,
    'notificationSettings.emailNotifications': true 
  });
  
  const template = careerApplicationEmailTemplates.adminNotification(application);
  
  // Send to all admins
  for (const admin of admins) {
    await sendEmail(admin.email, template.subject, template.html);
  }
};

/* ---------- Export email templates for external use ---------- */
export { careerApplicationEmailTemplates };