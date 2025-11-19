'use client';

import { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { User } from '@/types/auth';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/Hooks/authHooks';

interface UserContextType {
  user: User | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  updateProfile: (data: Partial<User['profile']>) => Promise<void>;
  updateEmail: (email: string, password: string) => Promise<void>;
  updateEmergencyContact: (data: User['emergencyContact']) => Promise<void>;
  updateNotificationSettings: (settings: User['notificationSettings']) => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { auth } = useAuth();
  const [user, setUser] = useState<User | null>(auth.user);
  const [loading, setLoading] = useState(false);

  // Wrap fetchUser in useCallback to stabilize it
  const fetchUser = useCallback(async () => {
    if (!auth.isAuth) return;
    setLoading(true);
    try {
      const data = await apiFetch<User>('/user/me/profile');
      setUser(data);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  }, [auth.isAuth]); // Only recreate if isAuth changes

  // Sync auth.user and fetch fresh data when auth is ready
  useEffect(() => {
    if (auth.isReady && auth.isAuth && auth.user) {
      setUser(auth.user);
      fetchUser(); // Fetch latest from server
    } else if (auth.isReady && !auth.isAuth) {
      setUser(null);
      setLoading(false);
    }
  }, [auth.isReady, auth.isAuth, auth.user, fetchUser]);

  

  const updateProfile = async (data: Partial<User['profile']>) => {
    try {
      const updated = await apiFetch<User>('/auth/me/profile', {
        method: 'PATCH',
        body: data,
      });
      setUser(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const updateEmail = async (email: string, password: string) => {
    try {
      const updated = await apiFetch<User>('/auth/me/email', {
        method: 'PATCH',
        body: { email, password },
      });
      setUser(updated);
      toast.success('Email updated');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const updateEmergencyContact = async (data: User['emergencyContact']) => {
    try {
      const updated = await apiFetch<User>('/auth/me/emergency', {
        method: 'PATCH',
        body: data as unknown as Record<string, unknown>,
      });
      setUser(updated);
      toast.success('Emergency contact updated');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const updateNotificationSettings = async (settings: User['notificationSettings']) => {
    try {
      const updated = await apiFetch<User>('/auth/me/notifications', {
        method: 'PATCH',
        body: settings as unknown as Record<string, unknown>,
      });
      setUser(updated);
      toast.success('Notifications updated');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        fetchUser,
        updateProfile,
        updateEmail,
        updateEmergencyContact,
        updateNotificationSettings,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
