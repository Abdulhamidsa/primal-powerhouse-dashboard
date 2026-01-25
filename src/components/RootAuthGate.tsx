'use client';

import { useEffect, useState } from 'react';
import { useAuthRefresh } from '@/hooks/useAuthRefresh';

/**
 * Root-level auth gate that silently checks auth on initial load.
 * Does not show loading overlay - pages use skeletons for loading states.
 * Caches auth state to avoid repeated checks on navigation.
 */
export function RootAuthGate({ children }: { children: React.ReactNode }) {
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
      // For protected routes, check auth in background (no UI blocking)
      const checkAuth = async () => {
        try {
          // Determine which endpoint to call based on URL
          const isAdminRoute = pathname.startsWith('/admin');
          const checkUrl = isAdminRoute ? '/api/admin/check-auth' : '/api/user/data';

          const response = await fetch(checkUrl, {
            credentials: 'include',
            cache: 'no-store',
          });

          // If not authenticated on protected route, middleware will handle redirect
          if (!response.ok) {
            console.log('[AUTH] Not authenticated, middleware will redirect');
          } else {
            console.log('[AUTH] User authenticated');
          }
        } catch (error) {
          console.error('[AUTH] Check failed:', error);
        } finally {
          // Mark auth check as complete regardless of outcome
          setAuthChecked(true);
        }
      };

      checkAuth();
    } else {
      // For login routes, mark as checked immediately
      setAuthChecked(true);
    }
  }, [authChecked]);

  // Always render children - let pages handle their own loading states with skeletons
  return <>{children}</>;
}
