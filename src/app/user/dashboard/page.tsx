'use client';

import React, { useEffect, useRef, useState } from 'react';

interface UserData {
  name: string;
  motivationalMessage?: string;
}

export default function UserDashboardPage() {
  // 1) ALL hooks first. No early return before this point.
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevMessageRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('[DASHBOARD] Fetching user data...');
        const res = await fetch('/api/user/data');
        console.log('[DASHBOARD] Response status:', res.status);
        
        if (!res.ok) {
          console.error('[DASHBOARD] API returned non-ok status:', res.status);
          setError(`Failed to load user data (${res.status})`);
          setLoading(false);
          return;
        }

        const data = (await res.json()) as UserData;
        console.log('[DASHBOARD] Data received:', data);

        // Example: notification logic (optional)
        if (
          prevMessageRef.current &&
          data.motivationalMessage &&
          prevMessageRef.current !== data.motivationalMessage
        ) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Message from Your Coach', { body: data.motivationalMessage });
          }
        }

        prevMessageRef.current = data.motivationalMessage || null;

        setUserData(data);
        setError(null);
      } catch (err) {
        console.error('[DASHBOARD] Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    const interval = setInterval(fetchUserData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 2) NOW you can conditionally render safely
  if (loading) return <div>Loading…</div>;

  if (error) {
    return (
      <div className="text-red-600">
        <p>Error loading user data: {error}</p>
        <p className="text-sm text-gray-600 mt-2">Please make sure you are logged in.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Hi, {userData?.name?.split(' ')[0] || 'Member'}</h1>
      <p>{userData?.motivationalMessage || 'The only bad workout is the one that did not happen.'}</p>
    </div>
  );
}
