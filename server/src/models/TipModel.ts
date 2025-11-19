// src/models/TipModel.ts
import { Schema, model, Types } from 'mongoose';
import { ITip } from '../types/usersDetails';

const tipSchema = new Schema<ITip>({
    fromUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    toProfessionalId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    message: {
        type: String,
        maxlength: 200
    },
    appointmentId: {
        type: Schema.Types.ObjectId,
        ref: 'Appointment'
    }
}, {
    timestamps: true
});

tipSchema.index({ toProfessionalId: 1, createdAt: -1 });
tipSchema.index({ fromUserId: 1, toProfessionalId: 1 });

export default model<ITip>('Tip', tipSchema);