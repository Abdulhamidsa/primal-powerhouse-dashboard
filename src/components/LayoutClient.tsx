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

    const t = setTimeout(() => {
      setShow(false);
    }, 1000); // 1 second

    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <>
      <LoadingPortal show={show} />
      <PWAInstaller />
      <InstallPrompt />
    </>
  );
}
