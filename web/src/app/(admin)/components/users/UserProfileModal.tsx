'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  XCircle,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { RoleBadge } from '../users/ui/Rolebadges';

// ──────────────────────────────────────────────────────────────
// 1. Use the **global** User type (imported from @/types/auth)
// ──────────────────────────────────────────────────────────────
import { User, UserRole } from '@/types/auth';

interface Profile {
  dateOfBirth?: string;               // <-- **string | undefined** only
  location?: { city?: string; country?: string };
}

// Props now accept the **exact** global User type
interface Props {
  user: User | null;
  onClose: () => void;
}

export const UserProfileModal = ({ user, onClose }: Props) => {
  if (!user) return null;

  // Helper to safely render a profile field that may be null/undefined
  const safeDate = user.profile?.dateOfBirth ?? undefined;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        // ── ARIA ───────────────────────────────────────
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ─────────────────────────────────────── */}
          <div className="flex justify-between items-start mb-6">
            <h2 id="profile-modal-title" className="text-2xl font-bold">
              User Profile
            </h2>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              aria-label="Close profile modal"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* ── Avatar + basics ─────────────────────────────── */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold"
              aria-hidden="true"
            >
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <h3 className="text-xl font-semibold">{user.name}</h3>

              <p className="text-gray-500 flex items-center gap-1">
                <Mail className="w-4 h-4" aria-hidden="true" />
                {user.email}
              </p>

              {user.phoneNumber && (
                <p className="text-gray-500 flex items-center gap-1">
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  {user.phoneNumber}
                </p>
              )}
            </div>
          </div>

          {/* ── Grid info ──────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Role */}
            <div>
              <label className="text-sm text-gray-500">Role</label>
              <p className="font-medium">
                <RoleBadge role={user.role as UserRole} />
              </p>
            </div>

            {/* Verification status */}
            <div>
              <label className="text-sm text-gray-500">Status</label>
              <p className="font-medium flex items-center gap-1">
                {user.isVerified ? (
                  <>
                    Verified{' '}
                    <CheckCircle
                      className="w-4 h-4 text-green-500"
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  <>
                    Unverified{' '}
                    <XCircle
                      className="w-4 h-4 text-red-500"
                      aria-hidden="true"
                    />
                  </>
                )}
              </p>
            </div>

            {/* Date of Birth – only if it exists */}
            {safeDate && (
              <div>
                <label className="text-sm text-gray-500">Date of Birth</label>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  {format(new Date(safeDate), 'MMM d, yyyy')}
                </p>
              </div>
            )}

            {/* Location */}
            {user.profile?.location?.city && (
              <div>
                <label className="text-sm text-gray-500">Location</label>
                <p className="font-medium flex items-center gap-1">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  {user.profile.location.city},{' '}
                  {user.profile.location.country}
                </p>
              </div>
            )}
          </div>

          {/* ── Footer ─────────────────────────────────────── */}
          <div className="pt-4 mt-6 border-t">
            <p className="text-sm text-gray-500">
              Member since{' '}
              {format(new Date(user.createdAt), 'MMMM d, yyyy')}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};