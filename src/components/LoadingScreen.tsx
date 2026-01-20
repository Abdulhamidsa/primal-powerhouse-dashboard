'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LoadingScreen() {
  const [isMounted, setIsMounted] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(false), 2000);

    const handleBeforeUnload = () => {
      setIsMounted(true);
      setIsVisible(true);
    };

    const handleLoad = () => {
      setIsMounted(true);
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 500);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);

    return () => {
      clearTimeout(showTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  // Smooth unmount after fade-out
  useEffect(() => {
    if (!isVisible) {
      const t = setTimeout(() => setIsMounted(false), 200);
      return () => clearTimeout(t);
    }
  }, [isVisible]);

  if (!isMounted) return null;

  return (
    <div
      className={[
        'fixed inset-0 z-[9999] flex items-center justify-center',
        'transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      ].join(' ')}
    >
      {/* Glass background */}
      <div className="absolute inset-0 backdrop-blur-xl" />

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/15 dark:from-black/30 dark:to-black/40" />

      {/* iOS style capsule */}
      <div
        className={[
          'relative flex flex-col items-center justify-center gap-3',
          ' backdrop-blur-2xl',
          'px-8 py-7 shadow-2xl',
        ].join(' ')}
      >
        <div className="relative h-20 w-20">
          <Image
            src="/logo.png"
            alt="Loading"
            fill
            sizes="56px"
            className="object-contain animate-[pulse_1.2s_ease-in-out_infinite]"
            priority
          />
        </div>

        {/* tiny iOS dots */}
        <div className="mt-1 flex items-center gap-1.5">
          {/* <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70 animate-[bounce_0.9s_infinite]" /> */}
          {/* <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70 animate-[bounce_0.9s_0.15s_infinite]" /> */}
          {/* <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70 animate-[bounce_0.9s_0.3s_infinite]" /> */}
        </div>
      </div>
    </div>
  );
}
