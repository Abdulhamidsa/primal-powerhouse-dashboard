'use client';

import { useEffect, useState } from 'react';

/**
 * Root-level auth gate that prevents any content from rendering
 * until auth status is determined. Shows full-screen overlay during check.
 * This is the professional way - nothing renders until auth is verified.
 */
export function RootAuthGate({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
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
            return;
          }

          // User is authenticated - safe to render
          setIsReady(true);
        } catch {
          // On error, allow render - let app handle it
          setIsReady(true);
        }
      };

      checkAuth();
    } else {
      // For login routes, we're ready immediately
      // The login layout will handle its own auth check overlay
      setIsReady(true);
    }
  }, []);

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
