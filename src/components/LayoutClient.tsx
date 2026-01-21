'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import LoadingPortal from './layout/LoadingPortal';
import PWAInstaller from '@/components/PWAInstaller';
import InstallPrompt from '@/components/InstallPrompt';

export default function LayoutClient() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);

    const t = window.setTimeout(() => {
      setShow(false);
    }, 450); // tweak: 250–700ms

    return () => window.clearTimeout(t);
  }, [pathname]);

  return (
    <>
      <LoadingPortal show={show} />
      <PWAInstaller />
      <InstallPrompt />
    </>
  );
}
