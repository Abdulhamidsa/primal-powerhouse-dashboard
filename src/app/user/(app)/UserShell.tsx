'use client';

import Navigation from '@/components/Navigation';

export default function UserShell({ children }: { children: React.ReactNode }) {
  return <Navigation userType="user">{children}</Navigation>;
}
