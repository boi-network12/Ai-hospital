// src/models/RatingModel.ts
import { Schema, model, Types } from 'mongoose';
import { IRating } from '../types/usersDetails';

const ratingSchema = new Schema<IRating>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    professionalId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        maxlength: 500
    },
    appointmentId: {
        type: Schema.Types.ObjectId,
        ref: 'Appointment'
    }
}, {
    timestamps: true
});

ratingSchema.index({ professionalId: 1, createdAt: -1 });
ratingSchema.index({ userId: 1, professionalId: 1 }, { unique: true });

export default model<IRating>('Rating', ratingSchema);

