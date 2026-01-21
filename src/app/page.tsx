'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import { getSubdomainFromHostname, getLoginPathBySubdomain, getRootPathBySubdomain } from '@/lib/subdomain';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        // Get subdomain from current hostname
        const hostname = window.location.hostname;
        const subdomain = getSubdomainFromHostname(hostname);

        // Try to get user data to check if authenticated
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });

        // Force minimum 1 second loading screen
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (response.ok) {
          // User is authenticated, redirect to their dashboard
          const rootPath = getRootPathBySubdomain(subdomain);
          router.push(rootPath);
        } else {
          // Not authenticated, redirect to appropriate login
          const loginPath = getLoginPathBySubdomain(subdomain);
          router.push(loginPath);
        }
      } catch (error) {
        // Error checking auth, redirect to login
        const loginPath = getLoginPathBySubdomain(getSubdomainFromHostname(window.location.hostname));
        await new Promise(resolve => setTimeout(resolve, 1000));
        router.push(loginPath);
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
