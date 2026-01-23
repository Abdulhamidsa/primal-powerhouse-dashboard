'use client';

import { useAuthCheck } from '@/hooks/useAuthCheck';

export default function UserLoginLayout({ children }: { children: React.ReactNode }) {
  const { isChecking } = useAuthCheck({
    checkAuthUrl: '/api/user/data',
    redirectUrl: '/user/dashboard',
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
