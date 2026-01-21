'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import { getSubdomainFromHostname, getLoginPathBySubdomain } from '@/lib/subdomain';

/**
 * Root page - Handles redirect when middleware doesn't catch it
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      console.log('[Root Page] Mounting - will redirect');

      // Get subdomain
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const subdomain = getSubdomainFromHostname(hostname);

      // Check if user is authenticated
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          // Authenticated - redirect to dashboard
          console.log('[Root Page] User authenticated');
          const data = await response.json();
          if (data.user && data.user.id) {
            // User is authenticated
            router.push(subdomain === 'admin' ? '/admin/dashboard' : '/user/dashboard');
            return;
          }
        }
      } catch (error) {
        console.error('[Root Page] Error checking auth:', error);
      }

      // Not authenticated - redirect to login
      console.log('[Root Page] Redirecting to login');
      const loginPath = getLoginPathBySubdomain(subdomain);
      router.push(loginPath);
    };

    redirect();
  }, [router]);

  return (
    <>
      <LoadingScreen />
    </>
  );
}
