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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse space-y-4">
          <div className="h-12 w-64 rounded-lg bg-muted" />
          <div className="h-12 w-64 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-background">{children}</div>;
}
