// src/context/AuthContext.tsx
import React, {
  createContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../Utils/api';
import type {
  AuthState,
  User,
  LoginPayload,
  RegisterPayload,
  OtpPayload,
  VerifyOtpPayload,
} from '@/types/auth';
import { useToast } from '@/Hooks/useToast.d';


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
      return { ...initialState, isReady: true };
    case 'REFRESH':
      return { ...state, accessToken: action.payload.accessToken };
    case 'READY':
      return { ...state, isReady: true };
    case 'DELETE_ACCOUNT':
      return { ...initialState, isReady: true };
    default:
      return state;
  }
}

type AuthContextProps = {
  auth: AuthState;
  login: (p: LoginPayload) => Promise<void>;
  register: (p: RegisterPayload) => Promise<void>;
  requestOtp: (p: OtpPayload) => Promise<void>;
  verifyOtpAndFinishRegister: (p: VerifyOtpPayload & { password: string }) => Promise<void>;
  requestResetOtp: (p: OtpPayload) => Promise<void>;
  resetPassword: (p: VerifyOtpPayload & { newPassword: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, dispatch] = useReducer(authReducer, initialState);
  const { showAlert } = useToast();

  // 
  // ------------------------------------------------------------------ //
  // 1. Restore tokens on app start
  const handleError = (title: string, err: any) => {
    const msg = err?.message || 'Something went wrong';
    showAlert({ message: `${title}: ${msg}`, type: 'error' });
    throw err;
  };
  // 
  // ------------------------------------------------------------------ //
  useEffect(() => {
    (async () => {
      const [access, refresh, rawUser] = await Promise.all([
        SecureStore.getItemAsync('accessToken'),
        SecureStore.getItemAsync('refreshToken'),
        SecureStore.getItemAsync('user'),
      ]);

      if (access && refresh && rawUser) {
        const user = JSON.parse(rawUser) as User;
        dispatch({ type: 'RESTORE', payload: { accessToken: access, refreshToken: refresh, user, isAuth: true } });
      } else {
        dispatch({ type: 'READY' });
      }
    })();
  }, []);

  // ------------------------------------------------------------------ //
  // 2. Persist tokens + user on every LOGIN / REFRESH
  // ------------------------------------------------------------------ //
  const persist = async (user: User, access: string, refresh: string) => {
    await Promise.all([
      SecureStore.setItemAsync('accessToken', access),
      SecureStore.setItemAsync('refreshToken', refresh),
      SecureStore.setItemAsync('user', JSON.stringify(user)),
    ]);
  };



  // ------------------------------------------------------------------ //
  // 3. Core actions
  // ------------------------------------------------------------------ //

  const login = async (payload: LoginPayload) => {
    try {
      const data = await apiFetch<{ accessToken: string; user: User; refreshToken?: string }>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const refreshToken = data.refreshToken ?? '';
      await persist(data.user, data.accessToken, refreshToken);
      dispatch({ type: 'LOGIN', payload: { user: data.user, accessToken: data.accessToken, refreshToken } });

      // Success feedback (optional)
      showAlert({
        message: `Welcome! Hi ${data.user.name || data.user.email}`,
        type: 'success'
      });
    } catch (err: any) {

      handleError('Login failed', err);
    }
  };

  const register = async (payload: RegisterPayload) => {
    await apiFetch('/auth/register/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: payload.email }),
    });
  };

  const requestOtp = async (payload: OtpPayload) => {
    try {
      await apiFetch('/auth/register/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      showAlert({
        message: `OTP sent! Check your inbox at ${payload.email}`,
        type: 'success'
      });
    } catch (err: any) {
      handleError('Could not send OTP', err);
    }
  };

  const verifyOtpAndFinishRegister = async (payload: VerifyOtpPayload & { password: string }) => {
    try {
      const { email, otp, password, ...rest } = payload;
      const data = await apiFetch<{ accessToken: string; user: User; refreshToken?: string }>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password, ...rest }),
      });

      const refreshToken = data.refreshToken ?? '';
      await persist(data.user, data.accessToken, refreshToken);
      dispatch({ type: 'LOGIN', payload: { user: data.user, accessToken: data.accessToken, refreshToken } });

      showAlert({ message: 'Account created successfully!', type: 'success' });
    } catch (err: any) {
      handleError('Registration failed', err);
    }
  };

  const requestResetOtp = async (payload: OtpPayload) => {
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload.email }),
      });
      showAlert({
        message: `Password reset code sent to ${payload.email}`,
        type: 'success'
      });
    } catch {
      // handleError('Could not send reset OTP', err);
      showAlert({
        message: 'If the email exists, a reset code has been sent.',
        type: 'info'
      });
    }
  };

  const resetPassword = async ({ email, otp, newPassword }: VerifyOtpPayload & { newPassword: string }) => {
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword
        }),
      });
      showAlert({ message: 'Password updated successfully!', type: 'success' });
    } catch (err: any) {
      handleError('Password reset failed', err);
    }
  };

  const logout = async () => {
    try {
      const refresh = await SecureStore.getItemAsync('refreshToken');

      // Only send if we actually have a refresh token
      if (refresh) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh }),
        }).catch(() => {
          // Ignore network errors — logout should still proceed locally
          console.log('Logout endpoint failed, continuing local logout');
        });
      }

      // Always clear local data, even if server failed
      await Promise.all([
        SecureStore.deleteItemAsync('accessToken'),
        SecureStore.deleteItemAsync('refreshToken'),
        SecureStore.deleteItemAsync('user'),
      ]);

      dispatch({ type: 'LOGOUT' });
      showAlert({ message: 'Logged out successfully', type: 'info' });
    } catch (err: any) {
      // Even if something fails, force local logout
      await Promise.all([
        SecureStore.deleteItemAsync('accessToken'),
        SecureStore.deleteItemAsync('refreshToken'),
        SecureStore.deleteItemAsync('user'),
      ]);
      dispatch({ type: 'LOGOUT' });
      showAlert({ message: 'Logged out locally', type: 'info' });
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refresh = await SecureStore.getItemAsync('refreshToken');
      if (!refresh) throw new Error('No refresh token');

      const data = await apiFetch<{ accessToken: string }>('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      await SecureStore.setItemAsync('accessToken', data.accessToken);
      dispatch({ type: 'REFRESH', payload: data });
    } catch (err: any) {
      // Refresh failures usually mean the session is dead → auto-logout
      await logout();
      handleError('Session expired', err);
    }
  };

  // Inside AuthProvider
  const deleteAccount = async () => {
    try {
      await apiFetch('/auth/me', { method: 'DELETE' });

      // wipe everything locally
      await Promise.all([
        SecureStore.deleteItemAsync('accessToken'),
        SecureStore.deleteItemAsync('refreshToken'),
        SecureStore.deleteItemAsync('user'),
      ]);

      dispatch({ type: 'DELETE_ACCOUNT' });
      showAlert({ message: 'Your account has been deleted.', type: 'info' });
    } catch (err: any) {
      handleError('Delete account failed', err);
    }
  };
  // ------------------------------------------------------------------ //
  // 4. Auto-refresh interceptor (optional – can be added in apiFetch)
  // ------------------------------------------------------------------ //
  // (You could also wrap `apiFetch` to retry once on 401 with refresh)

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
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}