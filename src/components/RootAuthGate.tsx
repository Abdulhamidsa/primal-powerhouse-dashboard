'use client';

import { useEffect, useState } from 'react';
import { useAuthRefresh } from '@/hooks/useAuthRefresh';

/**
 * Root-level auth gate that prevents any content from rendering
 * until auth status is determined. Only shows loading on initial page load.
 * Caches auth state to avoid loading screens on navigation.
 */
export function RootAuthGate({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Enable auto-refresh for persistent login in PWA
  useAuthRefresh();

  useEffect(() => {
    // Only check auth once on initial load
    if (authChecked) return;

    // Check if we're on a login route
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const isLoginRoute = pathname === '/admin/login' || pathname === '/user/login' || pathname === '/';

    if (!isLoginRoute) {
      // For protected routes, check auth before allowing render
      const checkAuth = async () => {
        try {
          // Determine which endpoint to call based on URL
          const isAdminRoute = pathname.startsWith('/admin');
          const checkUrl = isAdminRoute ? '/api/admin/check-auth' : '/api/user/data';

          const response = await fetch(checkUrl, {
            credentials: 'include',
            cache: 'no-store',
          });

          // If not authenticated on protected route, let middleware handle redirect
          if (!response.ok) {
            // Still allow render - middleware will catch and redirect
            setIsReady(true);
            setAuthChecked(true);
            return;
          }

          // User is authenticated - safe to render
          setIsReady(true);
          setAuthChecked(true);
        } catch {
          // On error, allow render - let app handle it
          setIsReady(true);
          setAuthChecked(true);
        }
      };

      checkAuth();
    } else {
      // For login routes, we're ready immediately
      setIsReady(true);
      setAuthChecked(true);
    }
  }, [authChecked]);

  if (!isReady) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
