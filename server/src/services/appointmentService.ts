import Appointment from '../models/AppointmentModel';
import User from '../models/UserModel';
import { Types } from 'mongoose';

interface GetPastAppointmentsFilters {
  userId: string;
  userRole: 'patient' | 'professional';
  page?: number;
  limit?: number;
  type?: string;
  professionalId?: string;
  patientId?: string;
  startDate?: Date;
  endDate?: Date;
}

export const getPastAppointments = async (filters: GetPastAppointmentsFilters) => {
  const {
    userId,
    userRole,
    page = 1,
    limit = 20,
    type,
    professionalId,
    patientId,
    startDate,
    endDate
  } = filters;

  const query: any = {
    status: { $in: ['completed', 'cancelled', 'rejected'] }
  };

  // Set date range - past appointments only
  query.date = { $lt: new Date() };

  // Role-specific filtering
  if (userRole === 'patient') {
    query.patientId = new Types.ObjectId(userId);
  } else if (userRole === 'professional') {
    query.professionalId = new Types.ObjectId(userId);
  }

  // Additional filters
  if (type) query.type = type;
  if (professionalId) query.professionalId = new Types.ObjectId(professionalId);
  if (patientId) query.patientId = new Types.ObjectId(patientId);
  
  if (startDate || endDate) {
    query.date = { ...query.date };
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  const skip = (page - 1) * limit;

  const appointments = await Appointment.find(query)
    .sort({ date: -1 }) // Most recent first
    .skip(skip)
    .limit(limit)
    .populate(
      userRole === 'patient' 
        ? 'professionalId'
        : 'patientId',
      'name profile.avatar profile.specialization profile.department phoneNumber email healthcareProfile'
    )
    .populate(
      userRole === 'patient'
        ? 'patientId'
        : 'professionalId',
      'name profile.avatar'
    )
    .lean();

  const total = await Appointment.countDocuments(query);

  return {
    appointments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

export const getRecentPastAppointment = async (
  userId: string,
  userRole: 'patient' | 'professional'
) => {
  const query: any = {
    status: { $in: ['completed', 'cancelled', 'rejected'] },
    date: { $lt: new Date() }
  };

  if (userRole === 'patient') {
    query.patientId = new Types.ObjectId(userId);
  } else {
    query.professionalId = new Types.ObjectId(userId);
  }

  const appointment = await Appointment.findOne(query)
    .sort({ date: -1 })
    .populate('professionalId', 'name profile.avatar profile.specialization profile.department healthcareProfile')
    .populate('patientId', 'name profile.avatar phoneNumber')
    .lean();

  return appointment;
};