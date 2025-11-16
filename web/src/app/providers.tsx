// app/providers.tsx
'use client';

import { AuthProvider } from '@/context/AuthContext';
import { UserProvider } from '@/context/UserContext';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UserProvider>
        {children}
        <Toaster position="top-center" />
      </UserProvider>
    </AuthProvider>
  );
}