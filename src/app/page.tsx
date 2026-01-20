'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Try to get user data to check if authenticated
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });

        // Force minimum 1 second loading screen
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (response.ok) {
          // User is authenticated, redirect to their dashboard
          router.push('/user/dashboard');
        } else {
          // Not authenticated, redirect to login
          router.push('/user/login');
        }
      } catch (error) {
        // Error checking auth, force loading screen then default to login
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push('/user/login');
      }
    };

    handleRedirect();
  }, [router]);

  return (
    <>
      <LoadingScreen />
    </>
  );
}
