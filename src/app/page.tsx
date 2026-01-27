'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSubdomainFromHostname } from '@/lib/subdomain';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const redirectToLogin = () => {
      // Try to get stored user type from localStorage (for PWA)
      const storedUserType = typeof window !== 'undefined' ? localStorage.getItem('userType') : null;

      if (storedUserType === 'admin') {
        router.replace('/admin/login');
        return;
      }

      // Get the hostname to determine subdomain (for web)
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      const subdomain = getSubdomainFromHostname(hostname);

      // Redirect to the appropriate login page based on subdomain
      const loginPath = subdomain === 'admin' ? '/admin/login' : '/user/login';
      router.replace(loginPath);
    };

    redirectToLogin();
  }, [router]);

  // Show a loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4" />
        <Image
          src="/loading-logo.png"
          alt="Loading"
          fill
          sizes="80px"
          className="object-contain animate-pulse"
          priority
        />{' '}
      </div>
    </div>
  );
}
