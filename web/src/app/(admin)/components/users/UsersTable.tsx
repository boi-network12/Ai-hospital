'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import {
  Search,
  MoreVertical,
  Eye,
  Shield,
  ShieldOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  CheckCircle,
  XCircle,
  Edit,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '@/context/AdminContext';
import { User, UserRole } from '@/types/auth';

interface Props {
  onViewProfile: (userId: string) => void;
  onUpdateUser: (user: User) => void;
}

export const UsersTable = ({ onViewProfile, onUpdateUser }: Props) => {
  const {
    admin,
    fetchUsers,
    updateUserRole,
    toggleRestrict,
    deleteUser,
  } = useAdmin();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Map of refs for each dropdown
  const dropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownOpen) return;

      const target = event.target as Node;
      const openDropdown = dropdownRefs.current.get(dropdownOpen);

      if (openDropdown && !openDropdown.contains(target)) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Fetch users
  useEffect(() => {
    fetchUsers({
      search: search || undefined,
      role: roleFilter || undefined,
      page,
      limit,
    });
  }, [search, roleFilter, page, fetchUsers]);

  const users = admin.users?.users ?? [];
  const total = admin.users?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    // Add validation
    if (!userId || userId === 'undefined') {
      toast.error('Invalid user ID');
      return;
    }

    try {
      await updateUserRole(userId, newRole);
      toast.success('Role updated');
    } catch (error: any) {
      console.error('Role update error:', error);
      toast.error(error.message || 'Failed to update role');
    }
  };

  const handleToggleRestrict = async (userId: string, restrict: boolean) => {
    try {
      await toggleRestrict(userId, restrict);
      toast.success(restrict ? 'User restricted' : 'User unrestricted');
    } catch (error: any) {
      console.error('Restrict toggle error:', error);
      toast.error(error.message || 'Failed to update restriction');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(userId);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const toggleDropdown = (userId: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(prev => prev === userId ? null : userId);
  };

  // Helper to set ref
  const setDropdownRef = useCallback(
    (userId: string) => (el: HTMLDivElement | null) => {
      if (el) {
        dropdownRefs.current.set(userId, el);
      } else {
        dropdownRefs.current.delete(userId);
      }
    },
    []
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownOpen) return;
      const node = dropdownRefs.current.get(dropdownOpen);
      if (node && !node.contains(e.target as Node)) setDropdownOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            aria-label="Search users by name or email"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as UserRole | '');
            setPage(1);
          }}
          className="px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          aria-label="Filter users by role"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="nurse">Nurse</option>
          <option value="doctor">Doctor</option>
          <option value="hospital">Hospital</option>
          <option value="admin">Admin</option>
          <option value="ai">AI</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Users management table">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {/* Loading */}
              {admin.loadingUsers && (
                <React.Fragment key="loading-skeletons">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td colSpan={5} className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              )}
              {/* Empty */}
              {!admin.loadingUsers && users.length === 0 && (
                <tr key="empty-state">
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    <p aria-live="polite">No users found.</p>
                  </td>
                </tr>
              )}
              {/* Rows */}
              {!admin.loadingUsers &&
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm"
                          aria-hidden="true"
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" aria-hidden="true" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value as UserRole)
                        }
                        className="text-sm border rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        aria-label={`Change role for ${user.name}`}
                      >
                        <option value="user">User</option>
                        <option value="nurse">Nurse</option>
                        <option value="doctor">Doctor</option>
                        <option value="hospital">Hospital</option>
                        <option value="admin">Admin</option>
                        <option value="ai">AI</option>
                      </select>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.isVerified ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
                            <span className="text-sm">Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-500" aria-hidden="true" />
                            <span className="text-sm">Unverified</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div
                        className="relative inline-block"
                        ref={setDropdownRef(user.id)}
                      >
                        <button
                          type="button"
                          onClick={toggleDropdown(user.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                          aria-label={`More actions for ${user.name}`}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                          {dropdownOpen === user.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -8 }}
                              transition={{ duration: 0.12 }}
                              className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ul className="py-1">
                                <li>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onViewProfile(user.id);
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition"
                                  >
                                    <Eye className="w-4 h-4" aria-hidden="true" />
                                    View Profile
                                  </button>
                                </li>
                                <li>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onUpdateUser(user);
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-blue-600 transition"
                                  >
                                    <Edit className="w-4 h-4" aria-hidden="true" />
                                    Update Profile
                                  </button>
                                </li>
                                <li>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleToggleRestrict(user.id, true);
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-orange-600 transition"
                                  >
                                    <ShieldOff className="w-4 h-4" aria-hidden="true" />
                                    Restrict User
                                  </button>
                                </li>
                                <li>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleToggleRestrict(user.id, false);
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-green-600 transition"
                                  >
                                    <Shield className="w-4 h-4" aria-hidden="true" />
                                    Unrestrict
                                  </button>
                                </li>
                                <li>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDelete(user.id);
                                      setDropdownOpen(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 flex items-center gap-2 transition"
                                  >
                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                    Delete User
                                  </button>
                                </li>
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-800 gap-3">
            <p className="text-sm text-gray-500" aria-live="polite">
              Showing {(page - 1) * limit + 1} to{' '}
              {Math.min(page * limit, total)} of {total} users
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Next page"
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