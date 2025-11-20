'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAdmin } from '@/context/AdminContext';
import { CreateUserModal } from '../../components/users/CreateUserModal';
import { UserProfileModal } from '../../components/users/UserProfileModal';
import { UsersTable } from '../../components/users/UsersTable';
import { User } from '@/types/auth';
import { UpdateUserModal } from '../../components/users/UpdateUserModal';


export default function UsersPage() {
  const { getUserProfile, fetchUsers } = useAdmin();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updateUser, setUpdateUser] = useState<User | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const viewProfile = async (userId: string) => {
    try {
      const profile = await getUserProfile(userId);
      setSelectedUser(profile);
    } catch (error: any) {
      console.error('View profile error:', error);
      toast.error(error.message || 'Failed to load profile');
    }
  };

  const handleUpdateUser = (user: User) => {
    setUpdateUser(user);
    setShowUpdateModal(true);
  };

  const handleUpdateSuccess = () => {
    // Refresh the users list after successful update
    fetchUsers();
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Users Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage roles, restrict access, and view user profiles
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5" />
          Create User
        </button>
      </div>

      {/* Table */}
      <UsersTable
        onViewProfile={viewProfile}
        onUpdateUser={handleUpdateUser}
      />

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <UserProfileModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />

      <UpdateUserModal
        user={updateUser}
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setUpdateUser(null);
        }}
        onSuccess={handleUpdateSuccess}
      />
    </>
  );
}