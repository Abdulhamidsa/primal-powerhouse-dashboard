'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Start hiding after initial auth check + buffer (around 2 seconds total)
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    const handleBeforeUnload = () => {
      setIsVisible(true);
    };

    const handleLoad = () => {
      setTimeout(() => setIsVisible(false), 500);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin">
          <Image src="/logo.png" alt="Loading" width={100} height={100} />
        </div>
      </div>
    </div>
  );
}
