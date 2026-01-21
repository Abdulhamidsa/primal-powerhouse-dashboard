'use client';

import Image from 'next/image';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-xl">
      <div className="relative h-20 w-20">
        <Image
          src="/loading-logo.png"
          alt="Loading"
          fill
          sizes="80px"
          className="object-contain animate-pulse"
          priority
        />
      </div>
    </div>
  );
}
