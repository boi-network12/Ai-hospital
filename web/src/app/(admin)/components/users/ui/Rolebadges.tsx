import React from 'react';
import { UserRole } from '@/types/auth';

const colors: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  doctor: 'bg-blue-100 text-blue-700 border-blue-200',
  nurse: 'bg-green-100 text-green-700 border-green-200',
  hospital: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  user: 'bg-gray-100 text-gray-700 border-gray-200',
  ai: 'bg-pink-100 text-pink-700 border-pink-200',
};

export const RoleBadge = ({ role }: { role: UserRole }) => (
  <span
    className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[role]}`}
  >
    {role.charAt(0).toUpperCase() + role.slice(1)}
  </span>
);