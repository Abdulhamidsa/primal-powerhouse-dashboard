'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Don't show navigation on login page
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation userType="admin">{children}</Navigation>
    </div>
  );
}
