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
  const prevMessageRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/user/data');
        if (!res.ok) return;

        const data = (await res.json()) as UserData;

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
      } catch (err) {
        console.error(err);
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

  return (
    <div>
      <h1>Hi, {userData?.name?.split(' ')[0] || 'Member'}</h1>
      <p>{userData?.motivationalMessage || 'The only bad workout is the one that did not happen.'}</p>
    </div>
  );
}
