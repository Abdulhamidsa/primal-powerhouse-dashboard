'use client';

import { WeeklyCheckInFlow } from '@/features/weekly-checkin/components/WeeklyCheckInFlow';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUserProfile } from '@/features/user-profile/hooks/useUserProfile';

export default function UserWeeklyCheckInPage() {
  const router = useRouter();
  const { user, isLoading } = useUserProfile();
  useEffect(() => { if (!isLoading && user?.accessMode === 'SELF_SERVICE') router.replace('/user/dashboard'); }, [isLoading, router, user?.accessMode]);
  if (user?.accessMode === 'SELF_SERVICE') return null;
  return (
    <div className="min-h-screen bg-background">
      <WeeklyCheckInFlow />
    </div>
  );
}
