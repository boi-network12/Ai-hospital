// app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/Hooks/authHooks';
import { useUser } from '@/Hooks/userHook';
import { AdminSidebar } from './components/Customs/AdminSidebar';
import { AdminTopBar } from './components/Customs/AdminTopBar';
import { SystemProvider, useSystem } from '@/context/SystemContext';
import { User } from '@/types/auth';
import { AdminProvider } from '@/context/AdminContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { auth, logout } = useAuth();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ---------- Admin-only access restriction ---------- */
  useEffect(() => {
    if (!auth.isReady || userLoading) return;

    // Not logged in → redirect home
    if (!auth.isAuth) {
      router.replace('/');
      return;
    }

    // Logged in but not an admin
    if (user && user.role !== 'admin') {
      router.replace('/');
      return;
    }

    // Visiting /admin → redirect to dashboard
    if (pathname === '/admin') {
      router.replace('/admin-dashboard');
    }
  }, [auth.isReady, auth.isAuth, user, userLoading, pathname, router]);

  /* ---------- loading UI ---------- */
  if (!auth.isReady || userLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="animate-pulse text-lg text-gray-700 dark:text-gray-300">
          Loading Admin Panel…
        </p>
      </div>
    );
  }

  /* ---------- real admin UI ---------- */
  return (
    <SystemProvider userId={user.id}>
      <AdminProvider>
        <AdminLayoutInner
          user={user}
          logout={logout}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        >
          {children}
        </AdminLayoutInner>
      </AdminProvider>
    </SystemProvider>
  );
}

/* ------------------------------------------------------------------ */
/*      Component that exists *inside* all providers                  */
/* ------------------------------------------------------------------ */
function AdminLayoutInner({
  user,
  logout,
  sidebarOpen,
  setSidebarOpen,
  children,
}: {
  user: User | null;
  logout: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const { health, activity, lastLogin, loading } = useSystem();

  return (
    <>
      {/* mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-75 bg-white dark:bg-gray-900 shadow-xl
            border-r border-gray-200 dark:border-gray-800
            transform transition-transform duration-300 lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <AdminSidebar
            onClose={() => setSidebarOpen(false)}
            user={user}
            logout={logout}
            health={health}
            activity={activity}
            lastLogin={lastLogin}
            loading={loading}
          />
        </aside>

        {/* Main column */}
        <div className="flex flex-1 flex-col lg:ml-64 overflow-hidden">
          <AdminTopBar onMenuClick={() => setSidebarOpen(true)} user={user} />

          <main className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-950">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
