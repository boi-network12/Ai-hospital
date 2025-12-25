// app/dashboard/admin/medical-practitioners/components/MedicalPractitionersTable.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/types/auth';
import {
  Search,
  MoreVertical,
  Eye,
  Mail,
  Phone,
  MapPin,
  Stethoscope,
  Activity,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';

interface Props {
  practitioners: User[];
  loading: boolean;
  onViewProfile: (user: User) => void;
  onManageTax?: (user: User) => void;
}

export const MedicalPractitionersTable = ({
  practitioners,
  loading,
  onViewProfile,
  onManageTax
}: Props) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'doctor' | 'nurse'>('all');
  const [page, setPage] = useState(1);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const limit = 10;
  const dropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Filter practitioners based on search and role
  const filteredPractitioners = practitioners.filter((practitioner) => {
    const matchesSearch =
      !search ||
      practitioner.name.toLowerCase().includes(search.toLowerCase()) ||
      practitioner.email.toLowerCase().includes(search.toLowerCase()) ||
      practitioner.profile?.specialization?.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === 'all' || practitioner.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPractitioners.length / limit);
  const paginatedPractitioners = filteredPractitioners.slice(
    (page - 1) * limit,
    page * limit
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownOpen) return;
      const openDropdown = dropdownRefs.current.get(dropdownOpen);
      if (openDropdown && !openDropdown.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const toggleDropdown = (userId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen((prev) => (prev === userId ? null : userId));
  };

  const setDropdownRef = (userId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      dropdownRefs.current.set(userId, el);
    } else {
      dropdownRefs.current.delete(userId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or specialization..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as 'all' | 'doctor' | 'nurse');
            setPage(1);
          }}
          className="px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          aria-label="Filter by Role"
        >
          <option value="all">All Practitioners</option>
          <option value="doctor">Doctors</option>
          <option value="nurse">Nurses</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Practitioner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role & Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tax Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedPractitioners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No medical practitioners found.
                  </td>
                </tr>
              ) : (
                paginatedPractitioners.map((practitioner) => (
                  <tr
                    key={practitioner.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm"
                          aria-hidden="true"
                        >
                          {practitioner.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {practitioner.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {practitioner.email}
                          </div>
                          {practitioner.phoneNumber && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {practitioner.phoneNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        {practitioner.role === 'doctor' ? (
                          <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                        )}
                        <span className="text-sm font-medium capitalize">
                          {practitioner.role}
                        </span>
                      </div>
                      {practitioner.profile?.specialization && (
                        <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 px-2 py-1 rounded">
                          {practitioner.profile.specialization}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm">
                            Rating: {practitioner.healthcareProfile?.stats?.averageRating?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">
                            Consults: {practitioner.healthcareProfile?.stats?.totalConsultations || 0}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-sm">
                            {practitioner.taxInfo?.hasTaxInfo ? (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                practitioner.taxInfo.status === 'verified' 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                  : practitioner.taxInfo.status === 'pending'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                  : practitioner.taxInfo.status === 'rejected'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                              }`}>
                                {practitioner.taxInfo.status || 'No Info'}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">Not Required</span>
                            )}
                          </div>
                          {practitioner.taxInfo?.taxId && (
                            <div className="text-xs text-gray-500 mt-1">
                              ID: {practitioner.taxInfo.taxId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {practitioner.profile?.location ? (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>
                            {practitioner.profile.location.city || 'Unknown'}
                            {practitioner.profile.location.country && 
                              `, ${practitioner.profile.location.country}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not specified</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {practitioner.isVerified ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm">Verified</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-red-500" />
                              <span className="text-sm">Unverified</span>
                            </>
                          )}
                        </div>
                        <div>
                          {practitioner.healthcareProfile?.availability?.isAvailable ? (
                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                              Available
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 px-2 py-1 rounded">
                              Offline
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div
                        className="relative inline-block"
                        ref={setDropdownRef(practitioner.id)}
                      >
                        <button
                          onClick={toggleDropdown(practitioner.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                            aria-label="Actions Menu"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                          {dropdownOpen === practitioner.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -8 }}
                              className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    onViewProfile(practitioner);
                                    setDropdownOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Full Profile
                                </button>
                                
                                <button
                                  onClick={() => {
                                    if (onManageTax) {
                                      onManageTax(practitioner);
                                    }
                                    setDropdownOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition"
                                >
                                  <FileText className="w-4 h-4" />
                                  Manage Tax Information
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-800 gap-3">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} to{' '}
              {Math.min(page * limit, filteredPractitioners.length)} of{' '}
              {filteredPractitioners.length} practitioners
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label='btn-previous-page'
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label='btn-next-page'
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};