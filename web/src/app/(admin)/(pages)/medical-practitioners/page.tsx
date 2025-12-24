// app/dashboard/admin/medical-practitioners/page.tsx
'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { User } from '@/types/auth';
import { MedicalPractitionersTable } from './components/MedicalPractitionersTable';
import { MedicalPractitionerProfileModal } from './components/MedicalPractitionerProfileModal';
import { motion } from 'framer-motion';
import { 
  Users, 
  Stethoscope, 
  Activity,
  Star,
  Clock,
  MapPin,
  Calendar
} from 'lucide-react';

export default function MedicalPractitionersPage() {
  const { admin } = useAdmin();
  const [selectedPractitioner, setSelectedPractitioner] = useState<User | null>(null);

  // Filter users to show only doctors and nurses
  const medicalPractitioners = admin.users?.users?.filter(
    user => user.role === 'doctor' || user.role === 'nurse'
  ) || [];

  // Calculate statistics
  const stats = {
    total: medicalPractitioners.length,
    doctors: medicalPractitioners.filter(p => p.role === 'doctor').length,
    nurses: medicalPractitioners.filter(p => p.role === 'nurse').length,
    available: medicalPractitioners.filter(p => 
      p.healthcareProfile?.availability?.isAvailable
    ).length,
    totalConsultations: medicalPractitioners.reduce(
      (sum, p) => sum + (p.healthcareProfile?.stats?.totalConsultations || 0), 
      0
    ),
  };

  const handleViewProfile = (user: User) => {
    setSelectedPractitioner(user);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Medical Practitioners
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and view doctors and nurses profiles
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Practitioners</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Doctors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.doctors}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Stethoscope className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Nurses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.nurses}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Available Now</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.available}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Table */}
      <MedicalPractitionersTable
        practitioners={medicalPractitioners}
        loading={admin.loadingUsers}
        onViewProfile={handleViewProfile}
      />

      {/* Profile Modal */}
      <MedicalPractitionerProfileModal
        practitioner={selectedPractitioner}
        onClose={() => setSelectedPractitioner(null)}
      />
    </div>
  );
}