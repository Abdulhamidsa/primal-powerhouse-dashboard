'use client';

import Image from 'next/image';

export default function HomePage() {
  // Middleware handles all redirects, this page just shows loading state
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <Image src="/loading-logo.png" alt="Loading" width={80} height={80} className="animate-pulse" priority />
    </div>
  );
}
