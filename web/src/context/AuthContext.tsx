'use client';

import React, {
  createContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import { apiFetch } from '@/lib/api';
import {
  AuthState,
  User,
  LoginPayload,
  OtpPayload,
  VerifyOtpPayload,
} from '@/types/auth';
import { toast } from 'react-hot-toast';
import { deleteCookie, setCookie, getCookie } from '@/helper/cookie';

type Action =
  | { type: 'RESTORE'; payload: Partial<AuthState> }
  | { type: 'LOGIN'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH'; payload: { accessToken: string } }
  | { type: 'READY' }
  | { type: 'DELETE_ACCOUNT' };

const initialState: AuthState = {
  isReady: false,
  isAuth: false,
  user: null,
  accessToken: null,
  refreshToken: null,
};

function authReducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case 'RESTORE':
      return { ...state, ...action.payload, isReady: true };
    case 'LOGIN':
      return {
        ...state,
        isAuth: true,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isReady: true,
      };
    case 'LOGOUT':
    case 'DELETE_ACCOUNT':
      return { ...initialState, isReady: true };
    case 'REFRESH':
      return { ...state, accessToken: action.payload.accessToken };
    case 'READY':
      return { ...state, isReady: true };
    default:
      return state;
  }
}

interface AuthContextProps {
  auth: AuthState;
  login: (p: LoginPayload) => Promise<void>;
  register: (p: { email: string }) => Promise<void>;
  requestOtp: (p: OtpPayload) => Promise<void>;
  verifyOtpAndFinishRegister: (p: VerifyOtpPayload & { password: string }) => Promise<void>;
  requestResetOtp: (p: OtpPayload) => Promise<void>;
  resetPassword: (p: VerifyOtpPayload & { newPassword: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, dispatch] = useReducer(authReducer, initialState);

  /* ---------- restore from cookies ---------- */
  useEffect(() => {
    const access = getCookie('accessToken');
    const refresh = getCookie('refreshToken');
    const rawUser = getCookie('user');

    if (access && refresh && rawUser) {
      try {
        const user = JSON.parse(rawUser) as User;
        dispatch({
          type: 'RESTORE',
          payload: { accessToken: access, refreshToken: refresh, user, isAuth: true },
        });
      } catch {
        dispatch({ type: 'READY' });
      }
    } else {
      dispatch({ type: 'READY' });
    }
  }, []);

  const persist = (user: User, access: string, refresh: string) => {
    setCookie('accessToken', access, 1);
    setCookie('refreshToken', refresh, 30);
    setCookie('user', JSON.stringify(user), 30);
  };

  /* ---------- actions ---------- */
  const login = async (payload: LoginPayload) => {
    try {
      const data = await apiFetch<{
        accessToken: string;
        user: User;
        refreshToken?: string;
      }>('/auth/login', { method: 'POST', body: payload });

      const refreshToken = data.refreshToken ?? '';
      persist(data.user, data.accessToken, refreshToken);
      dispatch({
        type: 'LOGIN',
        payload: { user: data.user, accessToken: data.accessToken, refreshToken },
      });
      toast.success(`Welcome, ${data.user.name || data.user.email}!`);
    } catch (err) {
      const message = (err as Error).message || 'Login failed';
      toast.error(message);
      throw err;
    }
  };

  const register = async (payload: { email: string }) => {
    await apiFetch('/auth/register/otp', { method: 'POST', body: payload });
  };

  const requestOtp = async (payload: OtpPayload) => {
    try {
      await apiFetch('/auth/register/otp', { method: 'POST', body: payload });
      toast.success(`OTP sent to ${payload.email}`);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to send OTP');
    }
  };

  const verifyOtpAndFinishRegister = async (
    payload: VerifyOtpPayload & { password: string }
  ) => {
    try {
      const { email, otp, password, ...rest } = payload;
      const data = await apiFetch<{
        accessToken: string;
        user: User;
        refreshToken?: string;
      }>('/auth/register', {
        method: 'POST',
        body: { email, otp, password, ...rest },
      });

      const refreshToken = data.refreshToken ?? '';
      persist(data.user, data.accessToken, refreshToken);
      dispatch({
        type: 'LOGIN',
        payload: { user: data.user, accessToken: data.accessToken, refreshToken },
      });
      toast.success('Account created successfully!');
    } catch (err) {
      toast.error((err as Error).message || 'Registration failed');
    }
  };

  const requestResetOtp = async (payload: OtpPayload) => {
    try {
      await apiFetch('/auth/forgot/otp', { method: 'POST', body: payload });
      toast.success(`Reset OTP sent to ${payload.email}`);
    } catch (err) {
      toast.error((err as Error).message || 'Failed to send reset OTP');
    }
  };

  const resetPassword = async ({
    email,
    otp,
    newPassword,
  }: VerifyOtpPayload & { newPassword: string }) => {
    try {
      await apiFetch('/auth/forgot/reset', {
        method: 'POST',
        body: { email, otp, newPassword },
      });
      toast.success('Password updated successfully!');
    } catch (err) {
      toast.error((err as Error).message || 'Password reset failed');
    }
  };

  const logout = async () => {
    try {
      const refresh = getCookie('refreshToken');
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: { refreshToken: refresh },
      }).catch(() => {});
      ['accessToken', 'refreshToken', 'user'].forEach(deleteCookie);
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refresh = getCookie('refreshToken');
      if (!refresh) throw new Error('No refresh token');

      const data = await apiFetch<{ accessToken: string }>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: refresh },
      });

      setCookie('accessToken', data.accessToken, 1);
      dispatch({ type: 'REFRESH', payload: data });
    } catch {
      await logout();
      toast.error('Session expired. Please log in again.');
    }
  };

  const deleteAccount = async () => {
    try {
      await apiFetch('/auth/me', { method: 'DELETE' });
      ['accessToken', 'refreshToken', 'user'].forEach(deleteCookie);
      dispatch({ type: 'DELETE_ACCOUNT' });
      toast.success('Your account has been deleted.');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete account');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        login,
        register,
        requestOtp,
        verifyOtpAndFinishRegister,
        requestResetOtp,
        resetPassword,
        logout,
        refreshAccessToken,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
