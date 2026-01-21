'use client';

import { createPortal } from 'react-dom';
import LoadingScreen from './LoadingScreen';

export default function LoadingPortal({ show }: { show: boolean }) {
  if (!show) return null;
  return createPortal(<LoadingScreen />, document.body);
}
