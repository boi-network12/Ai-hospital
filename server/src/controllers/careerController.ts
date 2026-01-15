import { Request, Response } from 'express';
import * as careerService from '../services/careerService';
import * as notificationService from '../services/notificationService';
import { AuthRequest } from '../middlewares/authMiddleware';

const paramsStr = (userId: string | string[]): string => {
  if (Array.isArray(userId)) {
    return userId[0];
  }
  return userId;
};

/* ---------- Submit career application (Public) ---------- */
export const submitApplication = async (req: Request, res: Response) => {
  try {
    const application = await careerService.submitCareerApplication(req.body);
    
    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId: application._id,
      status: application.status,
    });
  } catch (error: any) {
    console.error('Application submission error:', error);
    res.status(400).json({ message: error.message });
  }
};

/* ---------- Get all applications (Admin) ---------- */
export const getAllApplications = async (req: AuthRequest, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      desiredRole: req.query.role as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await careerService.getAllApplications(filters);
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/* ---------- Get single application (Admin) ---------- */
export const getApplication = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = paramsStr(id); 
    const application = await careerService.getApplicationById(idStr);
    
    res.json(application);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};


/* ---------- Update application status (Admin) ---------- */
export const updateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = paramsStr(id);
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const application = await careerService.updateApplicationStatus(
      idStr,
      status,
      req.user._id,
      notes
    );

    // Send notification if needed
    if (status === 'under_review' && application) {
      await notificationService.sendNotification({
        userId: req.user._id, // Admin notification
        type: 'career_review',
        title: 'Application Assigned for Review',
        message: `You have been assigned to review ${application.fullName}'s application.`,
        priority: 'medium',
        actionUrl: `/admin/career/applications/${id}`,
      });
    }

    res.json(application);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/* ---------- Schedule interview (Admin) ---------- */
export const scheduleInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = paramsStr(id);
    const { interviewDate, interviewLink, notes } = req.body;
    
    if (!interviewDate || !interviewLink) {
      return res.status(400).json({ 
        message: 'Interview date and link are required' 
      });
    }

    const application = await careerService.scheduleInterview(
      idStr,
      new Date(interviewDate),
      interviewLink,
      req.user._id,
      notes
    );

    res.json(application);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/* ---------- Approve application and create user (Admin) ---------- */
export const approveAndCreateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = paramsStr(id);
    const { password, notes } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        message: 'Temporary password is required' 
      });
    }

    const result = await careerService.approveApplicationAndCreateUser(
      idStr,
      req.user._id,
      password,
      notes
    );

    res.json({
      message: 'Application approved and user account created',
      application: result.application,
      user: result.user,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/* ---------- Assign application to admin (Admin) ---------- */
export const assignToAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const idStr = paramsStr(id);
    const { adminId } = req.body;
    
    if (!adminId) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }

    const application = await careerService.assignApplicationToAdmin(idStr, adminId);
    
    res.json(application);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/* ---------- Get statistics (Admin) ---------- */
export const getStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await careerService.getApplicationStatistics();
    
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

/* ---------- Check application status (Public) ---------- */
export const checkStatus = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.query;
    
    if (!email && !phoneNumber) {
      return res.status(400).json({ 
        message: 'Email or phone number is required' 
      });
    }

    const query: any = {};
    if (email) query.email = email;
    if (phoneNumber) query.phoneNumber = phoneNumber;

    const applications = await careerService.getAllApplications({
      search: email as string,
      limit: 5,
    });

    res.json(applications);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};