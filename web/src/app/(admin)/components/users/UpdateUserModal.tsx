// components/users/UpdateUserModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAdmin } from '@/context/AdminContext';
import { User, UserRole, Gender } from '@/types/auth';

interface Props {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const UpdateUserModal = ({ user, isOpen, onClose, onSuccess }: Props) => {
    const { updateUserProfile } = useAdmin();

    const [form, setForm] = useState<Partial<User>>({});
    const [loading, setLoading] = useState(false);

    // Initialize form with user data when modal opens
    useEffect(() => {
        if (user && isOpen) {
            setForm({
                name: user.name || '',
                phoneNumber: user.phoneNumber || '',
                role: user.role || 'user',
                profile: {
                    ...user.profile,
                    dateOfBirth: user.profile?.dateOfBirth || '',
                    gender: user.profile?.gender || 'Prefer not to say',
                    location: {
                        city: user.profile?.location?.city || '',
                        state: user.profile?.location?.state || '',
                        country: user.profile?.location?.country || '',
                    },
                    bio: user.profile?.bio || '',
                    bloodGroup: user.profile?.bloodGroup || '',
                    genotype: user.profile?.genotype || '',
                    height: user.profile?.height || undefined,
                    weight: user.profile?.weight || undefined,
                    specialization: user.profile?.specialization || '',
                    department: user.profile?.department || '',
                },
                emergencyContact: {
                    name: user.emergencyContact?.name || '',
                    relationship: user.emergencyContact?.relationship || '',
                    phoneNumber: user.emergencyContact?.phoneNumber || '',
                },
            });
        }
    }, [user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await updateUserProfile(user.id, form);
            toast.success('User profile updated successfully');
            onSuccess?.();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileChange = (field: string, value: any) => {
        setForm(prev => ({
            ...prev,
            profile: {
                ...prev.profile,
                [field]: value,
            },
        }));
    };

    const handleLocationChange = (field: 'city' | 'state' | 'country', value: string) => {
        setForm(prev => ({
            ...prev,
            profile: {
                ...prev.profile,
                location: {
                    ...prev.profile?.location,
                    [field]: value,
                },
            },
        }));
    };

    const handleEmergencyContactChange = (field: keyof NonNullable<User['emergencyContact']>, value: string) => {
        setForm(prev => ({
            ...prev,
            emergencyContact: {
                // Ensure emergencyContact always exists and has default empty strings
                name: prev.emergencyContact?.name ?? '',
                relationship: prev.emergencyContact?.relationship ?? '',
                phoneNumber: prev.emergencyContact?.phoneNumber ?? '',
                [field]: value,
            },
        }));
    };

    if (!isOpen || !user) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-user-modal-title"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <h2 id="update-user-modal-title" className="text-xl font-bold">
                        Update User Profile
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                        aria-label="Close update modal"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    value={form.name || ''}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    aria-label="User name input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={form.phoneNumber || ''}
                                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    aria-label='phone number'
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Role</label>
                                <select
                                    value={form.role || 'user'}
                                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    aria-label='role'
                                >
                                    <option value="user">User</option>
                                    <option value="nurse">Nurse</option>
                                    <option value="doctor">Doctor</option>
                                    <option value="hospital">Hospital</option>
                                    <option value="admin">Admin</option>
                                    <option value="ai">AI</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                            Profile Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    value={form.profile?.dateOfBirth || ''}
                                    onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    aria-label='date of birth'
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Gender</label>
                                <select
                                    value={form.profile?.gender || 'Prefer not to say'}
                                    onChange={(e) => handleProfileChange('gender', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    aria-label='gender'
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                    <option value="Prefer not to say">Prefer not to say</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Blood Group</label>
                                <input
                                    type="text"
                                    value={form.profile?.bloodGroup || ''}
                                    onChange={(e) => handleProfileChange('bloodGroup', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="e.g., O+"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Genotype</label>
                                <input
                                    type="text"
                                    value={form.profile?.genotype || ''}
                                    onChange={(e) => handleProfileChange('genotype', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="e.g., AA"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                            Location
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">City</label>
                                <input
                                    type="text"
                                    value={form.profile?.location?.city || ''}
                                    onChange={(e) => handleLocationChange('city', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    aria-label="City"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">State</label>
                                <input
                                    type="text"
                                    value={form.profile?.location?.state || ''}
                                    onChange={(e) => handleLocationChange('state', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    aria-label="State"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Country</label>
                                <input
                                    type="text"
                                    value={form.profile?.location?.country || ''}
                                    onChange={(e) => handleLocationChange('country', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    aria-label="Country"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Professional Details (for healthcare roles) */}
                    {(form.role === 'doctor' || form.role === 'nurse') && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                                Professional Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Specialization</label>
                                    <input
                                        type="text"
                                        value={form.profile?.specialization || ''}
                                        onChange={(e) => handleProfileChange('specialization', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        aria-label="Specialization"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Department</label>
                                    <input
                                        type="text"
                                        value={form.profile?.department || ''}
                                        onChange={(e) => handleProfileChange('department', e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        aria-label="Department"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Bio</label>
                                    <textarea
                                        value={form.profile?.bio || ''}
                                        onChange={(e) => handleProfileChange('bio', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Professional biography..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Emergency Contact */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                            Emergency Contact
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    value={form.emergencyContact?.name || ''}
                                    onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    aria-label='emergency name'
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Relationship</label>
                                <input
                                    type="text"
                                    value={form.emergencyContact?.relationship || ''}
                                    onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="e.g., Spouse, Parent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={form.emergencyContact?.phoneNumber || ''}
                                    onChange={(e) => handleEmergencyContactChange('phoneNumber', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    aria-label='emergency phone'
                                />
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Updating...' : 'Update Profile'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};