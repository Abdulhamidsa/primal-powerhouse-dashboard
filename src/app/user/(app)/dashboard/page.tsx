'use client';

import { useMotivationNotification } from '@/hooks/useMotivationNotification';
import { UserDashboardContent } from '@/features/user-dashboard/components/UserDashboardContent';
import { UserDashboardSkeleton } from '@/features/user-dashboard/components/UserDashboardSkeleton';
import { useUserDashboardSummary } from '@/features/user-dashboard/hooks/useUserDashboardSummary';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useUserProfile } from '@/features/user-profile/hooks/useUserProfile';
import { SelfServiceDashboardContent } from '@/features/self-service-dashboard/components/SelfServiceDashboardContent';
import { SelfServiceDashboardSkeleton } from '@/features/self-service-dashboard/components/SelfServiceDashboardSkeleton';

export default function UserDashboardPage() {
  const { summary, error, isLoading, refresh } = useUserDashboardSummary();
  const { user, error: profileError, isLoading: profileLoading } = useUserProfile();

  useMotivationNotification(user?.accessMode === 'COACHING' ? summary?.user.motivationalMessage ?? undefined : undefined);

  if (isLoading || profileLoading) {
    return (
      <div className="px-4 pb-6 pt-4 md:px-5">
        <div className="mx-auto w-full max-w-2xl">
          {user?.accessMode === 'SELF_SERVICE' ? <SelfServiceDashboardSkeleton /> : <UserDashboardSkeleton />}
        </div>
      </div>
    );
  }

  if (error || profileError || !summary || !user) {
    return (
      <div className="px-4 py-6 md:px-5">
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-destructive/20 bg-destructive/10 p-5">
          <p className="text-sm font-semibold text-destructive">Error loading dashboard</p>
          <p className="mt-1 text-sm text-muted-foreground">{error?.message ?? profileError?.message ?? 'Unable to load dashboard data.'}</p>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefreshAction={refresh}>
      <div className="px-4 pb-6 pt-5 md:px-5">
        <div className="mx-auto w-full max-w-2xl">
          {user.accessMode === 'SELF_SERVICE' ? <SelfServiceDashboardContent summary={summary} /> : <UserDashboardContent summary={summary} />}
        </div>
      </div>
    </PullToRefresh>
  );
}
