// src/models/LogModel.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ILog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  details: any;
  performedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LogSchema = new Schema<ILog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  details: { type: Schema.Types.Mixed, default: {} },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

LogSchema.index({ userId: 1 });
LogSchema.index({ action: 1 });
LogSchema.index({ createdAt: -1 });
LogSchema.index({ performedBy: 1 });

export default mongoose.model<ILog>('Log', LogSchema);