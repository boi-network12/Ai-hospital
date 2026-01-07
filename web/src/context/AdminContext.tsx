'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { apiFetch } from '@/lib/api';
import { ITaxInfo, User, UserRole } from '@/types/auth';
import { toast } from 'react-hot-toast';
import { AuthContext } from './AuthContext';

/* -------------------------------------------------
   Types
   ------------------------------------------------- */
export interface AdminAnalytics {
  totalUsers: number;
  usersByRole: Record<UserRole, number>;
  verifiedUsers: number;
  pendingRoleRequests: number;
  activeSessions: number;
}

export interface AdminUserList {
  users: User[];
  total: number;
  page: number;
  limit: number;
}



interface AdminState {
  analytics: AdminAnalytics | null;
  users: AdminUserList | null;
  loadingAnalytics: boolean;
  loadingUsers: boolean;
}

type Action =
  | { type: 'SET_ANALYTICS'; payload: AdminAnalytics }
  | { type: 'SET_USERS'; payload: AdminUserList }
  | { type: 'LOADING_ANALYTICS'; payload: boolean }
  | { type: 'LOADING_USERS'; payload: boolean }
  | { type: 'RESET' };

const initialState: AdminState = {
  analytics: null,
  users: null,
  loadingAnalytics: false,
  loadingUsers: false,
};

function adminReducer(state: AdminState, action: Action): AdminState {
  switch (action.type) {
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'LOADING_ANALYTICS':
      return { ...state, loadingAnalytics: action.payload };
    case 'LOADING_USERS':
      return { ...state, loadingUsers: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

/* -------------------------------------------------
   Context
   ------------------------------------------------- */
interface AdminContextProps {
  admin: AdminState;
  fetchAnalytics: () => Promise<void>;
  fetchUsers: (opts?: {
    role?: UserRole;
    search?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;

  // Admin actions
  createUser: (data: {
    email: string;
    password: string;
    name: string;
    phoneNumber?: string;
    role: UserRole;
    gender?: string;
    dateOfBirth?: string;
  }) => Promise<User>;
  updateUserRole: (userId: string, role: UserRole) => Promise<User>;
  toggleRestrict: (userId: string, restrict: boolean) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  getUserProfile: (userId: string) => Promise<User>;
  handleRoleRequest: (
    userId: string,
    approve: boolean,
    adminNote?: string
  ) => Promise<User>;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<User>;

  updateUserTaxInfo: (userId: string, taxInfo: Partial<ITaxInfo>) => Promise<User>;
  verifyTaxInfo: (userId: string, data: {
    verified: boolean;
    status: ITaxInfo['status'];
    adminNotes?: string;
  }) => Promise<User>;
  getTaxInfo: (userId: string) => Promise<ITaxInfo>;
  removeTaxInfo: (userId: string) => Promise<void>;
  sendComplianceReminder: (
    userId: string, 
    reminderType: 'tax' | 'license' | 'both',
    customMessage?: string
  ) => Promise<void>;
}

const AdminContext = createContext<AdminContextProps | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, dispatch] = useReducer(adminReducer, initialState);
  const { auth } = useContext(AuthContext)!;

  /* ---------- Ensure admin only (stable) ---------- */
  const ensureAdmin = useCallback(() => {
    if (!auth.isAuth || auth.user?.role !== 'admin') {
      throw new Error('Admin access required');
    }
  }, [auth.isAuth, auth.user?.role]);

  /* ---------- Analytics ---------- */
  const fetchAnalytics = useCallback(async () => {
    ensureAdmin();
    dispatch({ type: 'LOADING_ANALYTICS', payload: true });
    try {
      const data = await apiFetch<AdminAnalytics>('/admin/analytics');
      dispatch({ type: 'SET_ANALYTICS', payload: data });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics';
      toast.error(message);
    } finally {
      dispatch({ type: 'LOADING_ANALYTICS', payload: false });
    }
  }, [ensureAdmin]);

  /* ---------- List users ---------- */
  const fetchUsers = useCallback(
    async (opts: {
      role?: UserRole;
      search?: string;
      page?: number;
      limit?: number;
    } = {}) => {
      ensureAdmin();
      dispatch({ type: 'LOADING_USERS', payload: true });
      try {
        const query = new URLSearchParams();
        if (opts.role) query.append('role', opts.role);
        if (opts.search) query.append('search', opts.search);
        if (opts.page) query.append('page', opts.page.toString());
        if (opts.limit) query.append('limit', opts.limit.toString());

        const endpoint = `/admin/users${query.toString() ? `?${query}` : ''}`;
        const data = await apiFetch<AdminUserList>(endpoint);
        dispatch({ type: 'SET_USERS', payload: data });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load users';
        toast.error(message);
      } finally {
        dispatch({ type: 'LOADING_USERS', payload: false });
      }
    },
    [ensureAdmin]
  );

  /* ---------- Create user ---------- */
  const createUser = async (data: {
    email: string;
    password: string;
    name: string;
    phoneNumber?: string;
    role: UserRole;
    gender?: string;
    dateOfBirth?: string;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
    specialization?: string;
    licenseNumber?: string;
    issuedCountry?: string;
  }): Promise<User> => {
    ensureAdmin();
    const user = await apiFetch<User>('/admin/users', {
      method: 'POST',
      body: data,
    });
    toast.success('User created');
    await fetchUsers(); // refresh list
    return user;
  };

  /* ---------- Update role ---------- */
  const updateUserRole = async (userId: string, role: UserRole): Promise<User> => {
    ensureAdmin();
    const user = await apiFetch<User>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: { role },
    });
    toast.success('Role updated');
    await fetchUsers();
    return user;
  };

  /* ---------- Restrict / Un-restrict ---------- */
  const toggleRestrict = async (userId: string, restrict: boolean): Promise<User> => {
    ensureAdmin();
    const user = await apiFetch<User>(`/admin/users/${userId}/restrict`, {
      method: 'PATCH',
      body: { restrict },
    });
    toast.success(restrict ? 'User restricted' : 'User un-restricted');
    await fetchUsers();
    return user;
  };

  /* ---------- Delete user ---------- */
  const deleteUser = async (userId: string): Promise<void> => {
    ensureAdmin();
    await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
    toast.success('User deleted');
    await fetchUsers();
  };

  /* ---------- Get any profile ---------- */
  const getUserProfile = async (userId: string): Promise<User> => {
    ensureAdmin();
    return await apiFetch<User>(`/admin/users/${userId}`);
  };

  /* ---------- Approve / Reject role request ---------- */
  const handleRoleRequest = async (
    userId: string,
    approve: boolean,
    adminNote?: string
  ): Promise<User> => {
    ensureAdmin();
    const user = await apiFetch<User>(`/admin/role-requests/${userId}`, {
      method: 'POST',
      body: { approve, adminNote },
    });
    toast.success(approve ? 'Role approved' : 'Role rejected');
    await fetchAnalytics();
    await fetchUsers();
    return user;
  };

  /** --------- update user profile ------------ */
  const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User> => {
    ensureAdmin();
    const user = await apiFetch<User>(`/admin/users/${userId}/profile`, {
      method: 'PATCH',
      body: updates,
    });
    toast.success('Profile updated');
    await fetchUsers(); // refresh list
    return user;
  };

  /* ---------- Tax Management Functions ---------- */
  
  /** --------- update user tax info ------------ */
  const updateUserTaxInfo = async (userId: string, taxInfo: Partial<ITaxInfo>): Promise<User> => {
    ensureAdmin();
    const user = await apiFetch<User>(`/admin/users/${userId}/tax-info`, {
      method: 'PATCH',
      body: taxInfo,
    });
    toast.success('Tax information updated');
    await fetchUsers(); // refresh list
    return user;
  };

  /** --------- verify tax info ------------ */
  const verifyTaxInfo = async (userId: string, data: {
    verified: boolean;
    status: ITaxInfo['status'];
    adminNotes?: string;
  }): Promise<User> => {
    ensureAdmin();
    const user = await apiFetch<User>(`/admin/users/${userId}/tax-verification`, {
      method: 'PATCH',
      body: data,
    });
    toast.success('Tax verification status updated');
    await fetchUsers(); // refresh list
    return user;
  };

  /** --------- get tax info ------------ */
  const getTaxInfo = async (userId: string): Promise<ITaxInfo> => {
    ensureAdmin();
    return await apiFetch<ITaxInfo>(`/admin/users/${userId}/tax-info`);
  };

  /** --------- remove tax info ------------ */
  const removeTaxInfo = async (userId: string): Promise<void> => {
    ensureAdmin();
    await apiFetch(`/admin/users/${userId}/tax-info`, { method: 'DELETE' });
    toast.success('Tax information removed');
    await fetchUsers(); // refresh list
  };

  const sendComplianceReminder = useCallback(async (
    userId: string,
    reminderType: 'tax' | 'license' | 'both',
    customMessage?: string
  ): Promise<void> => {
    ensureAdmin();
    
    try {
      await apiFetch(`/admin/users/${userId}/compliance-reminder`, {
        method: 'POST',
        body: { reminderType, customMessage },
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reminder');
      throw error;
    }
  }, [ensureAdmin]);

  /* ---------- Auto-load on mount (if admin) ---------- */
  useEffect(() => {
    if (auth.isReady && auth.isAuth && auth.user?.role === 'admin') {
      fetchAnalytics();
      fetchUsers();
    } else if (auth.isReady) {
      dispatch({ type: 'RESET' });
    }
  }, [
    auth.isReady,
    auth.isAuth,
    auth.user?.role,
    fetchAnalytics,
    fetchUsers,
  ]);

  return (
    <AdminContext.Provider
      value={{
        admin,
        fetchAnalytics,
        fetchUsers,
        createUser,
        updateUserRole,
        toggleRestrict,
        deleteUser,
        getUserProfile,
        handleRoleRequest,
        updateUserProfile,
        updateUserTaxInfo,
        verifyTaxInfo,
        getTaxInfo,
        removeTaxInfo,
        sendComplianceReminder
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

/* -------------------------------------------------
   Hook
   ------------------------------------------------- */
export const useAdmin = (): AdminContextProps => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
};