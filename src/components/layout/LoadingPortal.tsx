'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import LoadingScreen from './LoadingScreen';

export default function LoadingPortal({ show }: { show: boolean }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready || !show) return null;

  return createPortal(<LoadingScreen />, document.body);
}
