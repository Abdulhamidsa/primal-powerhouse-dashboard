'use client';

import { useMotivationNotification } from '@/hooks/useMotivationNotification';
import { useUserData } from '@/hooks/useUserData';
import React from 'react';

export default function UserDashboardPage() {
  const { user, error, isLoading } = useUserData();

  useMotivationNotification(user?.motivationalMessage);

  if (isLoading) return <div>Loading…</div>;

  if (error) {
    return (
      <div className="text-red-600">
        <p>Error loading user data: {error.message}</p>
        <p className="text-sm text-gray-600 mt-2">Please make sure you are logged in.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Hi, {user?.name?.split(' ')[0] || 'Member'}</h1>
      <p>{user?.motivationalMessage || 'The only bad workout is the one that did not happen.'}</p>
    </div>
  );
}
