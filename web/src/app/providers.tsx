// app/providers.tsx
'use client';

import { AuthProvider } from '@/context/AuthContext';
import { CareerProvider } from '@/context/CareerContext';
import { UserProvider } from '@/context/UserContext';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UserProvider>
        <CareerProvider>
          {children}
          <Toaster position="top-center" />
        </CareerProvider>
      </UserProvider>
    </AuthProvider>
  );
}