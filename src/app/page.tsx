'use client';

import LoadingScreen from '@/components/LoadingScreen';

/**
 * Root page - Middleware handles all redirects from here
 * This page should never be seen by users as middleware
 * redirects based on subdomain and authentication
 */
export default function Home() {
  return (
    <>
      <LoadingScreen />
    </>
  );
}
