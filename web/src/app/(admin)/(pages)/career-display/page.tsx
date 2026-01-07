// app/dashboard/admin/career-display/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Video,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Download,
  MessageSquare,
  MapPin,
  Briefcase,
  Award,
  DollarSign,
  Users,
  BarChart3,
  CalendarDays,
  UserCheck,
  UserX
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { CareerApplication, useCareer } from '@/context/CareerContext';
import { useAdmin } from '@/context/AdminContext';

export default function CareerDisplayPage() {
  const { career, fetchApplications, updateStatus, scheduleInterview, approveApplication } = useCareer();
  const { admin, createUser } = useAdmin();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<CareerApplication | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [interviewData, setInterviewData] = useState({
    date: '',
    time: '',
    link: '',
    notes: ''
  });
  const [approvalData, setApprovalData] = useState({
    password: '',
    confirmPassword: '',
    notes: ''
  });

  const limit = 10;
  const dropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Fetch applications on mount and when filters change
  useEffect(() => {
    fetchApplications({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      role: roleFilter !== 'all' ? roleFilter : undefined,
      page
    });
  }, [fetchApplications, statusFilter, roleFilter, page]);

  // Filter applications based on search
  const filteredApplications = career.applications?.applications?.filter(app => 
    search === '' ||
    app.fullName.toLowerCase().includes(search.toLowerCase()) ||
    app.email.toLowerCase().includes(search.toLowerCase()) ||
    app.specialization.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Calculate statistics
  const stats = {
    total: career.applications?.total || 0,
    pending: filteredApplications.filter(a => a.status === 'pending').length,
    underReview: filteredApplications.filter(a => a.status === 'under_review').length,
    interviewScheduled: filteredApplications.filter(a => a.status === 'interview_scheduled').length,
    approved: filteredApplications.filter(a => a.status === 'approved').length,
    rejected: filteredApplications.filter(a => a.status === 'rejected').length,
    doctors: filteredApplications.filter(a => a.desiredRole === 'doctor').length,
    nurses: filteredApplications.filter(a => a.desiredRole === 'nurse').length,
    hospitals: filteredApplications.filter(a => a.desiredRole === 'hospital').length,
  };

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / limit);
  const paginatedApplications = filteredApplications.slice(
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

  const toggleDropdown = (appId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen((prev) => (prev === appId ? null : appId));
  };

  const setDropdownRef = (appId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      dropdownRefs.current.set(appId, el);
    } else {
      dropdownRefs.current.delete(appId);
    }
  };

  const handleStatusUpdate = async (appId: string, status: string, notes?: string) => {
    try {
      await updateStatus(appId, status, notes);
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleScheduleInterview = async (appId: string) => {
    if (!interviewData.date || !interviewData.time || !interviewData.link) {
      toast.error('Please fill all required fields');
      return;
    }

    const interviewDateTime = `${interviewData.date}T${interviewData.time}`;
    
    try {
      await scheduleInterview(appId, interviewDateTime, interviewData.link, interviewData.notes);
      toast.success('Interview scheduled successfully');
      setShowScheduleModal(false);
      setInterviewData({ date: '', time: '', link: '', notes: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule interview');
    }
  };

  const handleApproveApplication = async (appId: string) => {
    if (!approvalData.password || !approvalData.confirmPassword) {
      toast.error('Please enter and confirm password');
      return;
    }

    if (approvalData.password !== approvalData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await approveApplication(appId, approvalData.password);
      toast.success('Application approved and user account created');
      setShowApproveModal(false);
      setApprovalData({ password: '', confirmPassword: '', notes: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve application');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'interview_scheduled': return 'bg-purple-100 text-purple-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor': return 'bg-blue-100 text-blue-800';
      case 'nurse': return 'bg-green-100 text-green-800';
      case 'hospital': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Career Applications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and review all career applications
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchApplications()}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            Refresh
          </button>
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.pending}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Interview Scheduled</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.interviewScheduled}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Video className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.approved}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.doctors}</div>
              <div className="text-sm opacity-90">Doctors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.nurses}</div>
              <div className="text-sm opacity-90">Nurses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.hospitals}</div>
              <div className="text-sm opacity-90">Hospitals</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm">
              {Math.round((stats.approved / (stats.total || 1)) * 100)}% Approval Rate
            </span>
          </div>
        </div>
      </div>

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

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="interview_scheduled">Interview Scheduled</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            aria-label="Filter by role"
          >
            <option value="all">All Roles</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="hospital">Hospital</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Applied
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Interview
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {career.loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={7} className="px-6 py-4">
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
              ) : paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    No applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedApplications.map((application) => (
                  <tr
                    key={application._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm"
                        >
                          {application.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {application.fullName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {application.email}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {application.phoneNumber}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(application.desiredRole)}`}>
                          {application.desiredRole.toUpperCase()}
                        </span>
                        <div className="text-sm font-medium">{application.specialization}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          {application.yearsOfExperience} years experience
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <a
                          href={application.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          <FileText className="w-4 h-4" />
                          Resume
                        </a>
                        <a
                          href={application.profilePictureUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          <Eye className="w-4 h-4" />
                          Profile Picture
                        </a>
                        {application.licenseDocumentUrl && (
                          <a
                            href={application.licenseDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
                          >
                            <Award className="w-4 h-4" />
                            License
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                        {application.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {format(new Date(application.applicationDate), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(application.applicationDate), 'h:mm a')}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {application.interviewDate ? (
                        <div className="space-y-1">
                          <div className="text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(application.interviewDate), 'MMM d, yyyy')}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {format(new Date(application.interviewDate), 'h:mm a')}
                          </div>
                          {application.interviewLink && (
                            <a
                              href={application.interviewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                              <Video className="w-3 h-3" />
                              Join Interview
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not scheduled</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div
                        className="relative inline-block"
                        ref={setDropdownRef(application._id)}
                      >
                        <button
                          onClick={toggleDropdown(application._id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                          aria-label="Open actions menu"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                          {dropdownOpen === application._id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -8 }}
                              className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setSelectedApplication(application);
                                    setDropdownOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Details
                                </button>

                                {application.status === 'pending' && (
                                  <button
                                    onClick={() => {
                                      handleStatusUpdate(application._id, 'under_review');
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition"
                                  >
                                    <Clock className="w-4 h-4" />
                                    Mark as Under Review
                                  </button>
                                )}

                                {application.status === 'under_review' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedApplication(application);
                                        setShowScheduleModal(true);
                                        setDropdownOpen(null);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition"
                                    >
                                      <Video className="w-4 h-4" />
                                      Schedule Interview
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleStatusUpdate(application._id, 'rejected', 'Not a good fit');
                                        setDropdownOpen(null);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition text-red-600"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Reject Application
                                    </button>
                                  </>
                                )}

                                {application.status === 'interview_scheduled' && (
                                  <button
                                    onClick={() => {
                                      setSelectedApplication(application);
                                      setShowApproveModal(true);
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition text-green-600"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                    Approve & Create Account
                                  </button>
                                )}

                                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                                <button
                                  onClick={() => {
                                    handleStatusUpdate(application._id, 'rejected');
                                    setDropdownOpen(null);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition text-red-600"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Reject
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
              {Math.min(page * limit, filteredApplications.length)} of{' '}
              {filteredApplications.length} applications
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Next Page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      <ApplicationDetailModal
        application={selectedApplication}
        onClose={() => setSelectedApplication(null)}
      />

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSubmit={() => selectedApplication && handleScheduleInterview(selectedApplication._id)}
        data={interviewData}
        onChange={setInterviewData}
      />

      {/* Approve Application Modal */}
      <ApproveApplicationModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onSubmit={() => selectedApplication && handleApproveApplication(selectedApplication._id)}
        data={approvalData}
        onChange={setApprovalData}
      />
    </div>
  );
  
}

/* -------------------------------------------------
   Application Detail Modal Component
   ------------------------------------------------- */
function ApplicationDetailModal({ application, onClose }: { 
  application: CareerApplication | null; 
  onClose: () => void 
}) {
  if (!application) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Application Details
                </h2>
                <p className="text-gray-500">#{application._id}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Personal Info */}
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Personal Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-500">Full Name</label>
                      <p className="font-medium">{application.fullName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-500">Email</label>
                        <p className="font-medium">{application.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Phone</label>
                        <p className="font-medium">{application.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-500">Gender</label>
                        <p className="font-medium">{application.gender}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Nationality</label>
                        <p className="font-medium">{application.country}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Date of Birth</label>
                      <p className="font-medium">
                        {application.dateOfBirth ? format(new Date(application.dateOfBirth), 'MMMM d, yyyy') : 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location Preferences
                  </h3>
                  <div>
                    <label className="text-sm text-gray-500">Preferred Locations</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {application.preferredLocations?.map((location, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                          {location}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4">
                      <label className="text-sm text-gray-500">Willing to Relocate</label>
                      <p className="font-medium">{application.willingToRelocate ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Professional Info */}
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Professional Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-500">Desired Role</label>
                      <p className="font-medium capitalize">{application.desiredRole}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Specialization</label>
                      <p className="font-medium">{application.specialization}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Years of Experience</label>
                      <p className="font-medium">{application.yearsOfExperience} years</p>
                    </div>
                    {application.currentPosition && (
                      <div>
                        <label className="text-sm text-gray-500">Current Position</label>
                        <p className="font-medium">{application.currentPosition}</p>
                      </div>
                    )}
                    {application.currentEmployer && (
                      <div>
                        <label className="text-sm text-gray-500">Current Employer</label>
                        <p className="font-medium">{application.currentEmployer}</p>
                      </div>
                    )}
                    {application.expectedSalary && (
                      <div>
                        <label className="text-sm text-gray-500">Expected Salary</label>
                        <p className="font-medium flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {application.expectedSalary.toLocaleString()}
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-500">Country</label>
                      <p className="font-medium">{application.country || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">State/Province</label>
                      <p className="font-medium">{application.state || 'Not provided'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">City</label>
                    <p className="font-medium">{application.city || 'Not provided'}</p>
                  </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Application Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-500">Application Date</label>
                      <p className="font-medium">
                        {format(new Date(application.applicationDate), 'MMMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Status</label>
                      <div className="mt-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          application.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                          application.status === 'interview_scheduled' ? 'bg-purple-100 text-purple-800' :
                          application.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {application.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {application.interviewDate && (
                      <div>
                        <label className="text-sm text-gray-500">Interview Scheduled</label>
                        <p className="font-medium">
                          {format(new Date(application.interviewDate), 'MMMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    )}
                    {application.interviewLink && (
                      <div>
                        <label className="text-sm text-gray-500">Interview Link</label>
                        <a
                          href={application.interviewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 font-medium block truncate"
                        >
                          {application.interviewLink}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cover Letter */}
            {application.coverLetter && (
              <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Cover Letter
                </h3>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-line">{application.coverLetter}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Close
              </button>
              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Resume
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* -------------------------------------------------
   Schedule Interview Modal Component
   ------------------------------------------------- */
function ScheduleInterviewModal({ isOpen, onClose, onSubmit, data, onChange }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  data: { date: string; time: string; link: string; notes: string };
  onChange: (data: any) => void;
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Schedule Interview</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Interview Date *</label>
                <input
                  type="date"
                  value={data.date}
                  onChange={(e) => onChange({ ...data, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  aria-label="Select interview date"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Interview Time *</label>
                <input
                  type="time"
                  value={data.time}
                  onChange={(e) => onChange({ ...data, time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                    aria-label="Select interview time"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Interview Link (Zoom/Google Meet) *</label>
                <input
                  type="url"
                  value={data.link}
                  onChange={(e) => onChange({ ...data, link: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://meet.google.com/..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={data.notes}
                  onChange={(e) => onChange({ ...data, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Additional instructions for the candidate..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Schedule Interview
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* -------------------------------------------------
   Approve Application Modal Component
   ------------------------------------------------- */
function ApproveApplicationModal({ isOpen, onClose, onSubmit, data, onChange }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  data: { password: string; confirmPassword: string; notes: string };
  onChange: (data: any) => void;
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <h2 className="text-xl font-bold mb-2">Approve Application</h2>
            <p className="text-gray-500 mb-6">Create user account for the approved applicant</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Temporary Password *</label>
                <input
                  type="password"
                  value={data.password}
                  onChange={(e) => onChange({ ...data, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter temporary password"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={data.confirmPassword}
                  onChange={(e) => onChange({ ...data, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Confirm password"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={data.notes}
                  onChange={(e) => onChange({ ...data, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Additional notes about the approval..."
                />
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Note:</strong> A user account will be created and login credentials will be sent to the applicant's email.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Approve & Create Account
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}