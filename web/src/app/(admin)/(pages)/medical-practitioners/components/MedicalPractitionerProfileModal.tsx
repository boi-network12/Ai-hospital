// app/dashboard/admin/medical-practitioners/components/MedicalPractitionerProfileModal.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/types/auth';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Stethoscope,
  Activity,
  Star,
  Clock,
  Award,
  Globe,
  DollarSign,
  Heart,
  Shield,
  CheckCircle,
  XCircle,
  Users,
  Briefcase,
  FileText,
  Clock as ClockIcon,
  CreditCard,
  Globe as GlobeIcon,
} from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  practitioner: User | null;
  onClose: () => void;
}

export const MedicalPractitionerProfileModal = ({ practitioner, onClose }: Props) => {
  if (!practitioner) return null;

  const isDoctor = practitioner.role === 'doctor';
  const healthcareProfile = practitioner.healthcareProfile;
  const stats = healthcareProfile?.stats || {};
  const location = practitioner.profile?.location;
  const emergencyContact = practitioner.emergencyContact;
  const roleStatus = practitioner.roleStatus;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                aria-label="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white text-2xl font-bold">
                    {practitioner.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{practitioner.name}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        {isDoctor ? (
                          <Stethoscope className="w-4 h-4 text-white" />
                        ) : (
                          <Activity className="w-4 h-4 text-white" />
                        )}
                        <span className="text-white font-medium capitalize">
                          {practitioner.role}
                        </span>
                      </div>
                      {practitioner.profile?.specialization && (
                        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                          <span className="text-white">
                            {practitioner.profile.specialization}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Personal Info */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Bio */}
                  {practitioner.profile?.bio && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        About
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {practitioner.profile.bio}
                      </p>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Rating</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {stats.averageRating?.toFixed(1) || '0.0'}
                            <span className="text-sm text-gray-500">/5</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Consultations</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {stats.totalConsultations || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <ClockIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Response Time</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {stats.responseTime ? `${stats.responseTime}m` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                          <DollarSign className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Hourly Rate</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            ${healthcareProfile?.hourlyRate || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services & Languages */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {healthcareProfile?.services && healthcareProfile.services.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Briefcase className="w-5 h-5" />
                          Services
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {healthcareProfile.services.map((service, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-lg text-sm"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {healthcareProfile?.languages && healthcareProfile.languages.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <GlobeIcon className="w-5 h-5" />
                          Languages
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {healthcareProfile.languages.map((language, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-sm"
                            >
                              {language}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Details */}
                <div className="space-y-6">
                  {/* Contact Info */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                          <p className="text-gray-900 dark:text-white">{practitioner.email}</p>
                        </div>
                      </div>

                      {practitioner.phoneNumber && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <Phone className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                            <p className="text-gray-900 dark:text-white">{practitioner.phoneNumber}</p>
                          </div>
                        </div>
                      )}

                      {location && (
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                            <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                            <p className="text-gray-900 dark:text-white">
                              {location.city || 'Unknown'}
                              {location.state && `, ${location.state}`}
                              {location.country && `, ${location.country}`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* License Info */}
                  {roleStatus && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        License Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                          {roleStatus.verifiedLicense ? (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                              <XCircle className="w-4 h-4" />
                              Not Verified
                            </span>
                          )}
                        </div>

                        {roleStatus.licenseNumber && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">License #</span>
                            <span className="text-gray-900 dark:text-white font-mono">
                              {roleStatus.licenseNumber}
                            </span>
                          </div>
                        )}

                        {roleStatus.issuedCountry && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Issued Country</span>
                            <span className="text-gray-900 dark:text-white">
                              {roleStatus.issuedCountry}
                            </span>
                          </div>
                        )}

                        {roleStatus.approvalDate && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Approved On</span>
                            <span className="text-gray-900 dark:text-white">
                              {format(new Date(roleStatus.approvalDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Personal Details */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Personal Details
                    </h3>
                    <div className="space-y-3">
                      {practitioner.profile?.gender && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Gender</span>
                          <span className="text-gray-900 dark:text-white">
                            {practitioner.profile.gender}
                          </span>
                        </div>
                      )}

                      {practitioner.profile?.dateOfBirth && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</span>
                          <span className="text-gray-900 dark:text-white">
                            {format(new Date(practitioner.profile.dateOfBirth), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Member Since</span>
                        <span className="text-gray-900 dark:text-white">
                          {format(new Date(practitioner.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};