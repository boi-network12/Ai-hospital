// src/models/RatingModel.ts
import { Schema, model, Types } from 'mongoose';
import { IRating } from '../types/usersDetails';

const ratingSchema = new Schema<IRating>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
    },
    professionalId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Professional ID is required'],
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        maxlength: 500
    },
    appointmentId: {
        type: Schema.Types.ObjectId,
        ref: 'Appointment',
        validate: {
            validator: function(v: any) {
                if (!v) return true; // Optional
                return Types.ObjectId.isValid(v);
            },
            message: 'Valid Appointment ID is required'
        }
    }
}, {
    timestamps: true
});

// Add pre-save middleware to ensure no null values
ratingSchema.pre('save', function(next) {
    // Convert string IDs to ObjectId if needed
    if (this.userId && typeof this.userId === 'string') {
        this.userId = new Types.ObjectId(this.userId);
    }
    
    if (this.professionalId && typeof this.professionalId === 'string') {
        this.professionalId = new Types.ObjectId(this.professionalId);
    }
    
    if (this.appointmentId && typeof this.appointmentId === 'string') {
        this.appointmentId = new Types.ObjectId(this.appointmentId);
    }
    
    // Validate required fields
    if (!this.userId || !this.professionalId) {
        const err = new Error('User ID and Professional ID are required');
        next(err);
        return;
    }
    
    // Ensure they're valid ObjectIds
    if (!Types.ObjectId.isValid(this.userId) || !Types.ObjectId.isValid(this.professionalId)) {
        const err = new Error('Invalid ID format');
        next(err);
        return;
    }
    
    next();
});

// Create a compound index with proper error handling
ratingSchema.index({ professionalId: 1, userId: 1 }, { 
    unique: true,
    name: 'unique_user_professional_rating'
});

// Additional indexes for better query performance
ratingSchema.index({ professionalId: 1, createdAt: -1 });
ratingSchema.index({ userId: 1, professionalId: 1, createdAt: -1 });


export default model<IRating>('Rating', ratingSchema);

