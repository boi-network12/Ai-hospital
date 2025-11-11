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

type Action =
  | { type: 'RESTORE'; payload: Partial<AuthState> }
  | { type: 'LOGIN'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH'; payload: { accessToken: string } }
  | { type: 'READY' };

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
};

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
     const [auth, dispatch] = useReducer(authReducer, initialState);

  // ------------------------------------------------------------------ //
  // 1. Restore tokens on app start
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
    const data = await apiFetch<{ accessToken: string; user: User; refreshToken?: string }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const refreshToken = data.refreshToken ?? '';
    await persist(data.user, data.accessToken, refreshToken);
    dispatch({ type: 'LOGIN', payload: { user: data.user, accessToken: data.accessToken, refreshToken } });
  };

   const register = async (payload: RegisterPayload) => {
    await apiFetch('/auth/register/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: payload.email }),
    });
  };

  const requestOtp = async (payload: OtpPayload) => {
    await apiFetch('/auth/register/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const verifyOtpAndFinishRegister = async (
    payload: VerifyOtpPayload & { password: string } & Partial<Omit<RegisterPayload, 'email' | 'password'>>
  ) => {
    const { email, otp, password, ...rest } = payload;
    const data = await apiFetch<{ accessToken: string; user: User; refreshToken?: string }>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, password, ...rest }),
    });

    const refreshToken = data.refreshToken ?? '';
    await persist(data.user, data.accessToken, refreshToken);
    dispatch({ type: 'LOGIN', payload: { user: data.user, accessToken: data.accessToken, refreshToken } });
  };

  const requestResetOtp = async (payload: OtpPayload) => {
    await apiFetch('/auth/forgot/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const resetPassword = async ({ email, otp, newPassword }: VerifyOtpPayload & { newPassword: string }) => {
    await apiFetch('/auth/forgot/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    });
  };

  const logout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    await Promise.all([
      SecureStore.deleteItemAsync('accessToken'),
      SecureStore.deleteItemAsync('refreshToken'),
      SecureStore.deleteItemAsync('user'),
    ]);
    dispatch({ type: 'LOGOUT' });
  };

  const refreshAccessToken = async () => {
    const refresh = await SecureStore.getItemAsync('refreshToken');
    if (!refresh) throw new Error('No refresh token');

    const data = await apiFetch<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    await SecureStore.setItemAsync('accessToken', data.accessToken);
    dispatch({ type: 'REFRESH', payload: data });
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}