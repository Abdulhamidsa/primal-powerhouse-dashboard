'use client';

import { useEffect, useRef } from 'react';
import { useMotivationNotification } from '@/hooks/useMotivationNotification';
import { UserDashboardContent } from '@/features/user-dashboard/components/UserDashboardContent';
import { UserDashboardSkeleton } from '@/features/user-dashboard/components/UserDashboardSkeleton';
import { useUserDashboardSummary } from '@/features/user-dashboard/hooks/useUserDashboardSummary';

export default function UserDashboardPage() {
  const { summary, error, isLoading } = useUserDashboardSummary();
  const mountStartedAtRef = useRef<number | null>(null);
  const loggedPaintRef = useRef(false);

  useMotivationNotification(summary?.user.motivationalMessage ?? undefined);

  useEffect(() => {
    mountStartedAtRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (isLoading || error || !summary || loggedPaintRef.current) return;

    loggedPaintRef.current = true;
    const mountStartedAt = mountStartedAtRef.current ?? performance.now();

    const raf = window.requestAnimationFrame(() => {
      const paintAt = performance.now();
      const renderMs = Math.round(paintAt - mountStartedAt);
      console.info('[USER_DASHBOARD_PAINT]', { renderMs });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [error, isLoading, summary]);

  if (isLoading) {
    return (
      <div className="px-4 pb-6 pt-4 md:px-5">
        <div className="mx-auto w-full max-w-2xl">
          <UserDashboardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="px-4 py-6 md:px-5">
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-destructive/20 bg-destructive/10 p-5">
          <p className="text-sm font-semibold text-destructive">Error loading dashboard</p>
          <p className="mt-1 text-sm text-muted-foreground">{error?.message ?? 'Unable to load dashboard data.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 pt-4 md:px-5">
      <div className="mx-auto w-full max-w-2xl">
        <UserDashboardContent summary={summary} />
      </div>
    </div>
  );
}
