// src/types/auth.ts
export type AuthState = {
  isReady: boolean;
  isAuth: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  // add any other fields you need from the backend
};

export type LoginPayload = { email: string; password: string };

export type RegisterPayload = {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: string;
};

export type OtpPayload = { email: string };
export type VerifyOtpPayload = { email: string; otp: string };