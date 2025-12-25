// src/context/SystemContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface SystemHealth {
  aiLoad: string;
  api: string;
  storage: string;
}
export interface ActivityItem {
  text: string;
  color: string;
}
export interface LastLogin {
  time: string;
  location: string;
}

export interface SystemData {
  health: SystemHealth | null;
  activity: ActivityItem[];
  lastLogin: LastLogin | null;
  loading: boolean;
}

export const SystemContext = createContext<SystemData | undefined>(undefined);

export const SystemProvider = ({ children, userId }: { children: ReactNode; userId: string | undefined }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [lastLogin, setLastLogin] = useState<LastLogin | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- health & activity (global) ----
  // ---- health & activity (global) ----
    useEffect(() => {
    const fetchGlobal = async () => {
        try {
        const [healthRes, activityRes] = await Promise.all([
            apiFetch<{ data: SystemHealth }>('/system/health'),
            apiFetch<{ data: ActivityItem[] }>('/system/activity'),
        ]);
        setHealth(healthRes.data);
        setActivity(activityRes.data);
        } catch (e) {
          toast.error('Failed to load system stats');
          throw e;
        } finally {
          setLoading(false);
        }
    };
    fetchGlobal();
    const id = setInterval(fetchGlobal, 30_000);
    return () => clearInterval(id);
    }, []);

  // ---- last login (per-user) ----
  useEffect(() => {
    if (!userId) {
      setLastLogin(null);
      return;
    }
    const fetchLast = async () => {
      try {
        const res = await apiFetch<{ data: LastLogin | null }>(`/system/last-login/${userId}`);
        setLastLogin(res.data);
      } catch {
        toast.error('Failed to load last login');
      } finally {
        setLoading(false);
      }
    };
    fetchLast();
  }, [userId]);

  return (
    <SystemContext.Provider value={{ health, activity, lastLogin, loading }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error('useSystem must be used within SystemProvider');
  return ctx;
};