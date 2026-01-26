'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import LoadingScreen from './LoadingScreen';

export default function LoadingPortal({ show }: { show: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !show) return null;

  return createPortal(<LoadingScreen />, document.body);
}
