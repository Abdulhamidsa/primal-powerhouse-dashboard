'use client';

import React, { useEffect, useRef } from 'react';
import useSWR from 'swr';
import type { ApiError } from '@/lib/fetcher';

interface UserData {
  name: string;
  motivationalMessage?: string;
}

export default function UserDashboardPage() {
  const prevMessageRef = useRef<string | null>(null);

  const { data, error, isLoading } = useSWR<UserData, ApiError>('/api/user/data');

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!data) return;

    const next = data.motivationalMessage ?? null;

    if (
      prevMessageRef.current &&
      next &&
      prevMessageRef.current !== next &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification('New Message from Your Coach', { body: next });
    }

    prevMessageRef.current = next;
  }, [data]);

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
      <h1>Hi, {data?.name?.split(' ')[0] || 'Member'}</h1>
      <p>{data?.motivationalMessage || 'The only bad workout is the one that did not happen.'}</p>
    </div>
  );
}
