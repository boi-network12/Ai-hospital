'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  X, Home, Users, Settings, LogOut,
  Activity, Server, Cpu, HardDrive, Clock
} from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Logo from "@/assets/img/icon.png";
import { User } from '@/types/auth';
import { ActivityItem, LastLogin, SystemHealth } from '@/context/SystemContext';
import "../../admin.css";

interface Props {
  onClose?: () => void;
  user: User | null;
  logout: () => void;
  health: SystemHealth | null;
  activity: ActivityItem[];
  lastLogin: LastLogin | null; 
  loading: boolean;
}

export function AdminSidebar({ 
   onClose, 
   user, 
   logout, 
   health,
   activity,
   lastLogin,
   loading
  }: Props) {
  const pathname = usePathname();

  /* ---------------- NAVIGATION ITEMS ---------------- */
  const navItems = [
    { href: '/admin-dashboard', label: 'Dashboard', icon: Home },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/admin/settings', label: 'Settings', icon: Settings }
  ];

  /* ---------------- SIDEBAR WIDGETS ---------------- */
  const systemHealth = [
    { label: "AI Load", value: health?.aiLoad, icon: Cpu, color: "text-indigo-500" },
    { label: "API", value: health?.api, icon: Server, color: "text-green-500" },
    { label: "Storage", value: health?.storage, icon: HardDrive, color: "text-orange-500" },
  ];


  const handleLogout = async () => {
    await logout();
    onClose?.();
  };

  return (
    <aside className="flex h-full flex-col bg-gray-50 dark:bg-gray-950">

      {/* HEADER */}
      <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
        <Link href="/admin-dashboard" className="flex items-center gap-3">
          <Image src={user?.profile?.avatar || Logo} alt="Neuromed" width={36} height={36} />
          <span className="text-lg font-bold">Neuromed Admin</span>
        </Link>

        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800"
          aria-label='btn'
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 p-4 space-y-2">

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onClose} className="block relative group">
              {isActive && (
                <motion.div
                  layoutId="activeSidebar"
                  className="absolute inset-0 bg-linear-to-r from-indigo-500 to-purple-600 rounded-xl shadow-md"
                />
              )}
              <div
                className={`relative z-10 flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition
                  ${isActive ? "text-white" : "hover:bg-gray-200 dark:hover:bg-gray-800"}
                `}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </div>
            </Link>
          );
        })}

        {/* SYSTEM HEALTH (MAP RENDERED) */}
        <div className="mt-6 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <Server className="w-4 h-4" /> System Health
          </h3>

          {systemHealth.map(({ label, value, icon: Icon, color }, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1">
              <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Icon className="w-3 h-3" /> {label}
              </span>
              <span className={`font-medium ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* LAST LOGIN */}
        <div className="mt-4 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4" /> Last Login
          </h3>

          {loading ? (
            <p className="text-xs text-gray-500">Loading…</p>
          ) : lastLogin ? (
            <>
              <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">{lastLogin.time}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Location: {lastLogin.location}</p>
            </>
          ) : (
            <p className="text-xs text-gray-500">Never</p>
          )}
        </div>

        {/* ACTIVITY (MAP RENDERED) */}
        <div className="mt-4 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4" /> Recent Activity
          </h3>

          {loading ? (
            <p className="text-xs text-gray-500">Loading…</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {activity.length === 0 ? (
                <li className="text-gray-500">No recent activity</li>
              ) : (
                activity.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    {item.text}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>

        <div className="text-[11px] text-gray-400 mt-3 text-center">
          Neuromed Admin v1.0.1
          <div className="flex justify-center items-center gap-1 text-green-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Server Running
          </div>
        </div>
      </div>

    </aside>
  );
}
