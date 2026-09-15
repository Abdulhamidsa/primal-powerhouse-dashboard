'use client';

import { useMotivationNotification } from '@/hooks/useMotivationNotification';
import { UserDashboardContent } from '@/features/user-dashboard/components/UserDashboardContent';
import { UserDashboardSkeleton } from '@/features/user-dashboard/components/UserDashboardSkeleton';
import { useUserDashboardSummary } from '@/features/user-dashboard/hooks/useUserDashboardSummary';
import { PullToRefresh } from '@/components/PullToRefresh';

export default function UserDashboardPage() {
  const { summary, error, isLoading, refresh } = useUserDashboardSummary();

  useMotivationNotification(summary?.user.motivationalMessage ?? undefined);

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
    <PullToRefresh onRefresh={refresh}>
      <div className="px-4 pb-6 md:px-5">
        <div className="mx-auto w-full max-w-2xl">
          <UserDashboardContent summary={summary} />
        </div>
      </div>
    </PullToRefresh>
  );
}
