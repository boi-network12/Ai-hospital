// src/services/tipService.ts
import Tip from '../models/TipModel';
import User from '../models/UserModel';

interface SendTipData {
    fromUserId: string;
    toProfessionalId: string;
    amount: number;
    message?: string;
    appointmentId?: string;
}

export const sendTip = async (data: SendTipData) => {
    // Check if user has sufficient balance
    const fromUser = await User.findById(data.fromUserId);
    if (!fromUser) throw new Error('User not found');

    if (fromUser.walletBalance < data.amount) {
        throw new Error('Insufficient balance');
    }

    // Deduct from sender
    fromUser.walletBalance -= data.amount;
    await fromUser.save();

    // Add to professional
    const toProfessional = await User.findById(data.toProfessionalId);
    if (!toProfessional) throw new Error('Professional not found');

    toProfessional.walletBalance += data.amount;
    toProfessional.healthcareProfile!.stats.totalTips += data.amount;
    await toProfessional.save();

    // Create tip record
    const tip = new Tip(data);
    await tip.save();

    return tip;
};