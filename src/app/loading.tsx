// src/app/loading.tsx
import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/15 backdrop-blur-xl" />
      <div className="relative h-20 w-20">
        <Image
          src="/loading-logo.png"
          alt="Loading"
          fill
          sizes="80px"
          className="object-contain animate-[pulse_1.2s_ease-in-out_infinite]"
          priority
        />
      </div>
    </div>
  );
}
