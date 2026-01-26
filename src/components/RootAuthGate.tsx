'use client';

import { useAuthRefresh } from '@/hooks/useAuthRefresh';

/**
 * Root-level auth gate that silently checks auth on initial load.
 * Does not show loading overlay - pages use skeletons for loading states.
 * Caches auth state to avoid repeated checks on navigation.
 */
export function RootAuthGate({ children }: { children: React.ReactNode }) {
  // Enable auto-refresh for persistent login in PWA
  useAuthRefresh();

  // Let middleware + layouts handle redirect logic to avoid client-side flashes
  return <>{children}</>;
}
