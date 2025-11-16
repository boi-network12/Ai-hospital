'use client';

import { Menu } from 'lucide-react';
import { User } from '@/types/auth';
import "../../admin.css";

interface Props {
  onMenuClick: () => void;
  user: User | null;
}



export function AdminTopBar({ onMenuClick, user }: Props) {

  console.log({'email': user?.email, "name": user?.name})

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
      
      {/* Menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        aria-label='btn'
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="lg:hidden w-10" />

      <div className="flex items-center gap-4">
        {/* Theme toggle */}
      
        {/* User */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 p-0.5">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-gray-900 text-sm font-semibold text-indigo-700 dark:text-indigo-200">
              {user?.name?.charAt(0).toUpperCase() ?? 'A'}
            </div>
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-900 dark:text-gray-200">
            {user?.name ?? user?.email}
          </span>
        </div>
      </div>
    </header>
  );
}
