'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show navigation on login page
  const isLoginPage = pathname === '/user/login';

  if (isLoginPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation userType="user">{children}</Navigation>
    </div>
  );
}
