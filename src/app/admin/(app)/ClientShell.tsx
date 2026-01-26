'use client';

import Navigation from '@/components/Navigation';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return <Navigation userType="admin">{children}</Navigation>;
}
