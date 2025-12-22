import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAppointment  {
  patientId: Types.ObjectId;
  professionalId: Types.ObjectId;
  type: 'virtual' | 'physical';
  date: Date; // e.g., 2025-12-22T10:00:00
  duration: number; // in minutes (30 or 60)
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  notes?: string;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  professionalId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['virtual', 'physical'], required: true },
  date: { type: Date, required: true },
  duration: { type: Number, default: 60 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  notes: String,
  endDate: { type: Date, required: true },
}, { timestamps: true });

AppointmentSchema.index({ professionalId: 1, date: 1 });
AppointmentSchema.index({ patientId: 1, date: 1 });
AppointmentSchema.index(
  { status: 1, date: 1 },
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    partialFilterExpression: { 
      status: { $in: ['pending', 'rejected'] } 
    }
  }
);

export default mongoose.model<IAppointment>('Appointment', AppointmentSchema);