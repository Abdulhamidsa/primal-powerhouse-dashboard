'use client';

import { useAuthCheck } from '@/hooks/useAuthCheck';

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  const { isChecking } = useAuthCheck({
    checkAuthUrl: '/api/admin/check-auth',
    redirectUrl: '/admin/dashboard',
    enabled: true,
  });

  if (isChecking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary" />
          <p className="text-muted-foreground text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-background">{children}</div>;
}
