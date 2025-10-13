'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // This will be handled by middleware for domain-based routing
    // But as fallback, redirect to login
    const hostname = window.location.hostname;

    if (hostname.includes('admin')) {
      router.push('/admin/login');
    } else {
      router.push('/user/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
