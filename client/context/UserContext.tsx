// src/context/UserContext.tsx
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiFetch } from '@/Utils/api';
import type { User } from '@/types/auth.d';
import { useAuth } from '@/Hooks/authHook.d';
import { useToast } from '@/Hooks/useToast.d';

type UserContextType = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (current: string, newPass: string) => Promise<void>;
  updateNotifications: (settings: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    smsNotifications?: boolean;
  }) => Promise<void>;
  updateAvatar: (file: any) => Promise<void>; // stub

  // Device functions
  getDevices: () => Promise<any[]>;
  revokeDevice: (token: string) => Promise<void>;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { auth } = useAuth()!;
  const { showAlert } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Wrap fetchUser in useCallback
  const fetchUser = useCallback(async () => {
    if (!auth.isAuth || !auth.accessToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiFetch<User>('/user/me/profile');
      setUser(data);
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [auth]); // Only re-create if these change

  // refreshUser can stay simple — it just calls fetchUser
  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  // Now use fetchUser safely
  useEffect(() => {
    fetchUser();
  }, [fetchUser]); // Safe: fetchUser is stable

  // === 1. General Profile Update ===
  const updateProfile = async (data: Partial<User>) => {
    try {
      await apiFetch('/user/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      await refreshUser();
      showAlert({ message: 'Profile updated!', type: 'success' });
    } catch (err: any) {
      showAlert({ message: err.message || 'Update failed', type: 'error' });
      throw err;
    }
  };

  // === 2. Email Update ===
  const updateEmail = async (email: string) => {
    try {
      await apiFetch('/user/me/email', {
        method: 'PATCH',
        body: JSON.stringify({ email }),
      });
      await refreshUser();
      showAlert({ message: 'Email updated! Verification may be required.', type: 'success' });
    } catch (err: any) {
      showAlert({ message: err.message || 'Email update failed', type: 'error' });
      throw err;
    }
  };

  // === 3. Password Update ===
  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await apiFetch('/user/me/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      showAlert({ message: 'Password changed successfully', type: 'success' });
    } catch (err: any) {
      showAlert({ message: err.message || 'Password change failed', type: 'error' });
      throw err;
    }
  };

  // === 4. Notification Settings ===
  const updateNotifications = async (settings: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    smsNotifications?: boolean;
  }) => {
    try {
      await apiFetch('/user/me/notifications', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
      await refreshUser();
      showAlert({ message: 'Notification settings saved', type: 'success' });
    } catch (err: any) {
      showAlert({ message: err.message || 'Failed to save settings', type: 'error' });
      throw err;
    }
  };

  // === 5. Avatar Upload (STUB) ===
  const updateAvatar = async (file: any) => {
    // TODO: Implement with FormData + multer on backend
    showAlert({ message: 'Avatar upload not implemented yet', type: 'info' });
    // Example (uncomment when ready):
    /*
    const form = new FormData();
    form.append('avatar', file);
    await apiFetch('/user/me/avatar', { method: 'PATCH', body: form });
    await refreshUser();
    */
  };

  // === 6. Devices ===
  const getDevices = async (): Promise<any[]> => {
    try {
      const devices = await apiFetch<any[]>('/user/me/devices');
      return devices;
    } catch (err: any) {
      showAlert({ message: 'Failed to load devices', type: 'error' });
      console.error(err)
      return [];
    }
  };

  const revokeDevice = async (token: string) => {
    try {
      await apiFetch('/user/me/devices/revoke', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      showAlert({ message: 'Device revoked', type: 'success' });
    } catch (err: any) {
      showAlert({ message: 'Failed to revoke device', type: 'error' });
      throw err;
    }
  };

  return (
    <UserContext.Provider value={{
        user,
        loading,
        refreshUser,

        updateProfile,
        updateEmail,
        updatePassword,
        updateNotifications,
        updateAvatar,

        getDevices,
        revokeDevice,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};