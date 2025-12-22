import express from 'express';
import { generateAppointmentEmail } from '../services/emailService';

const router = express.Router();

// Preview email templates (development only)
router.get('/preview/:status', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: 'Preview only available in development' });
  }
  
  const status = req.params.status;
  const validStatuses = ['confirmed', 'completed', 'cancelled', 'rejected'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  
  const sampleData = {
    appointmentId: 'app_123456789',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    duration: 60,
    type: 'physical' as const,
    notes: 'Follow-up consultation for recent treatment',
    patientName: 'John Smith',
    patientEmail: 'john@example.com',
    professionalName: 'Dr. Sarah Johnson',
    professionalEmail: 'dr.sarah@example.com',
    status: status as any,
    oldStatus: 'pending',
    rescheduleDate: status === 'cancelled' ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : undefined
  };
  
  const html = generateAppointmentEmail(sampleData);
  
  res.send(html);
});

export default router;