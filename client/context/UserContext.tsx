// src/context/UserContext.tsx
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiFetch } from '@/Utils/api';
import type { User } from '@/types/auth.d';
import { useAuth } from '@/Hooks/authHook.d';

type UserContextType = {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { auth } = useAuth()!;
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
  }, [auth.isAuth, auth.accessToken]); // Only re-create if these change

  // refreshUser can stay simple — it just calls fetchUser
  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  // Now use fetchUser safely
  useEffect(() => {
    fetchUser();
  }, [fetchUser]); // Safe: fetchUser is stable

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};