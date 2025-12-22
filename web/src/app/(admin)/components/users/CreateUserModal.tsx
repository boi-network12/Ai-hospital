'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAdmin } from '@/context/AdminContext';
import { UserRole } from '@/types/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateUserModal = ({ isOpen, onClose }: Props) => {
  const { createUser } = useAdmin();

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phoneNumber: '',
    role: 'user' as UserRole,
    gender: 'Prefer not to say' as 'Male' | 'Female' | 'Other' | 'Prefer not to say',
    dateOfBirth: '',
    specialization: '',
    licenseNumber: '',
    issuedCountry: '',
    location: {
      city: '',
      state: '',
      country: '',
    },
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUser({
        ...form,
        ...(form.role === 'doctor' || form.role === 'nurse' ? { specialization: form.specialization } : {})
      });
      toast.success('User created successfully');
      onClose();
      setForm({
        email: '',
        password: '',
        name: '',
        phoneNumber: '',
        role: 'user',
        gender: 'Prefer not to say',
        dateOfBirth: '',
        specialization: '',
        licenseNumber: '',
        issuedCountry: '',
        location: {
          city: '',
          state: '',
          country: '',
        },
      });
    } catch {
      // Error toast handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (field: 'city' | 'state' | 'country', value: string) => {
    setForm(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }));
  };

  if (!isOpen) return null;

  const isHealthcareRole = form.role === 'doctor' || form.role === 'nurse';
  const showLicenseInfo = form.role === 'doctor' || form.role === 'nurse' || form.role === 'hospital';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
          <h2 id="create-user-modal-title" className="text-xl font-bold">
            Create New User
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Grid */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wide">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label htmlFor="name-input" className="block text-sm font-medium mb-2">
                    Name *
                  </label>
                  <input
                    id="name-input"
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email-input" className="block text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    id="email-input"
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password-input" className="block text-sm font-medium mb-2">
                    Password *
                  </label>
                  <input
                    id="password-input"
                    required
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone-input" className="block text-sm font-medium mb-2">
                    Phone (Optional)
                  </label>
                  <input
                    id="phone-input"
                    type="text"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label htmlFor="gender-select" className="block text-sm font-medium mb-2">
                    Gender
                  </label>
                  <select
                    id="gender-select"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800"
                  >
                    <option value="Prefer not to say">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label htmlFor="dob-input" className="block text-sm font-medium mb-2">
                    Date of Birth
                  </label>
                  <input
                    id="dob-input"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Location Grid */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wide">
                Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city-input" className="block text-sm font-medium mb-2">
                    City
                  </label>
                  <input
                    id="city-input"
                    type="text"
                    value={form.location.city}
                    onChange={(e) => handleLocationChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800"
                  />
                </div>

                <div>
                  <label htmlFor="state-input" className="block text-sm font-medium mb-2">
                    State
                  </label>
                  <input
                    id="state-input"
                    type="text"
                    value={form.location.state}
                    onChange={(e) => handleLocationChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800"
                  />
                </div>

                <div>
                  <label htmlFor="country-input" className="block text-sm font-medium mb-2">
                    Country
                  </label>
                  <input
                    id="country-input"
                    type="text"
                    value={form.location.country}
                    onChange={(e) => handleLocationChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wide">
                Role & Specialization
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="role-select" className="block text-sm font-medium mb-2">
                    Role *
                  </label>
                  <select
                    id="role-select"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800"
                  >
                    <option value="user">User</option>
                    <option value="nurse">Nurse</option>
                    <option value="doctor">Doctor</option>
                    <option value="hospital">Hospital</option>
                    <option value="admin">Admin</option>
                    <option value="ai">AI</option>
                  </select>
                </div>

                {/* Specialization */}
                {isHealthcareRole && (
                  <div>
                    <label htmlFor="specialization-input" className="block text-sm font-medium mb-2">
                      Specialization
                    </label>
                    <input
                      id="specialization-input"
                      type="text"
                      value={form.specialization}
                      onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                      placeholder={form.role === 'doctor' ? 'Cardiology, Pediatrics, etc.' : 'General Nursing, Midwifery, etc.'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* License Information */}
            {showLicenseInfo && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wide">
                  License Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="license-number" className="block text-sm font-medium mb-2">
                      License Number
                    </label>
                    <input
                      id="license-number"
                      type="text"
                      value={form.licenseNumber}
                      onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                      placeholder="e.g., MDCN/12345"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="issued-country" className="block text-sm font-medium mb-2">
                      Issued Country
                    </label>
                    <input
                      id="issued-country"
                      type="text"
                      value={form.issuedCountry}
                      onChange={(e) => setForm({ ...form, issuedCountry: e.target.value })}
                      placeholder="e.g., Nigeria"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800"
                    />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer with Buttons */}
        <div className="border-t dark:border-gray-800 p-6 sticky bottom-0 bg-white dark:bg-gray-900 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              aria-label="Cancel and close modal"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors font-medium"
              aria-label={loading ? 'Creating user...' : 'Create new user'}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};