'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
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
    gender: 'Prefer not to say',
    dateOfBirth: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUser(form);
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
      });
    } catch {
      // Error toast handled in context
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h2 id="create-user-modal-title" className="text-xl font-bold mb-4">
          Create New User
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name-input"
              className="block text-sm font-medium mb-1"
            >
              Name
            </label>
            <input
              id="name-input"
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              aria-label="Full name of the user"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email-input"
              className="block text-sm font-medium mb-1"
            >
              Email
            </label>
            <input
              id="email-input"
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              aria-label="Email address"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password-input"
              className="block text-sm font-medium mb-1"
            >
              Password
            </label>
            <input
              id="password-input"
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              aria-label="Password"
            />
          </div>

          {/* Phone (Optional) */}
          <div>
            <label
              htmlFor="phone-input"
              className="block text-sm font-medium mb-1"
            >
              Phone (Optional)
            </label>
            <input
              id="phone-input"
              type="text"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none"
              aria-label="Phone number (optional)"
            />
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="role-select"
              className="block text-sm font-medium mb-1"
            >
              Role
            </label>
            <select
              id="role-select"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as UserRole })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              aria-label="Select user role"
            >
              <option value="user">User</option>
              <option value="nurse">Nurse</option>
              <option value="doctor">Doctor</option>
              <option value="hospital">Hospital</option>
              <option value="admin">Admin</option>
              <option value="ai">AI</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border rounded-lg hover:bg-gray-50 transition"
              aria-label="Cancel and close modal"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
              aria-label={loading ? 'Creating user...' : 'Create new user'}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};