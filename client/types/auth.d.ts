// types/auth.d.ts
export type AuthState = {
  isAuth: boolean;
  isReady: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
};
