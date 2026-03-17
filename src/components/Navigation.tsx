'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { BarChart2, Utensils, Users, Flame, User, Shield, MessageSquare } from 'lucide-react';
import { useChatUnread } from '@/features/client-coach-messaging/hooks/useChatUnread';
import { cn } from '@/lib/utils';



type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

const adminNavItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: BarChart2,
    description: 'Overview & stats',
  },
  {
    name: 'Meals',
    href: '/admin/meals',
    icon: Utensils,
    description: 'Manage meal library',
  },
  // {
  //   name: 'Ingredients',
  //   href: '/admin/ingredients',
  //   icon: Salad,
  //   description: 'Food catalog',
  // },
  {
    name: 'Videos',
    href: '/admin/videos',
    icon: Flame,
    description: 'Training videos',
  },
  {
    name: 'Chat',
    href: '/admin/chat',
    icon: MessageSquare,
    description: 'Realtime messaging',
  },
  {
    name: 'Clients',
    href: '/admin/clients',
    icon: Users,
    description: 'Client management',
  },
];

const userNavItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/user/dashboard',
    icon: BarChart2,
    description: 'Overview',
  },
  {
    name: 'Meals',
    href: '/user/meals',
    icon: Utensils,
    description: 'Meal plans',
  },
  {
    name: 'Chat',
    href: '/user/chat',
    icon: MessageSquare,
    description: 'Coach messaging',
  },
  {
    name: 'Training',
    href: '/user/training',
    icon: Flame,
    description: 'Workout videos',
  },
];

const userAccountMenuItems: NavItem[] = [
  {
    name: 'Profile',
    href: '/user/profile',
    icon: User,
    description: 'My profile',
  },
  {
    name: 'Privacy',
    href: '/user/privacy',
    icon: Shield,
    description: 'Privacy & data',
  },
];

function isActivePath(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(href + '/');
}

const DesktopTopNavItem = React.memo(function DesktopTopNavItem({
  item,
  active,
  unreadCount,
}: {
  item: NavItem;
  active: boolean;
  unreadCount: number;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={[
        'relative inline-flex items-center gap-2 rounded-2xl px-4 py-2.5',
        'border transition-colors duration-200',
        active
          ? 'border-border bg-background text-foreground shadow-sm'
          : 'border-transparent text-muted-foreground hover:border-border/60 hover:bg-card/70 hover:text-foreground',
      ].join(' ')}
    >
      <Icon size={17} className={active ? 'text-primary' : ''} />

      <span className="text-sm font-medium">{item.name}</span>

      {unreadCount > 0 ? (
        <span
          className={[
            'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
            active ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary',
          ].join(' ')}
        >
          {unreadCount}
        </span>
      ) : null}

      {active ? <span className="absolute inset-x-3 bottom-0 h-px bg-primary/70 rounded-full" /> : null}
    </Link>
  );
});

const MobileTabItem = React.memo(function MobileTabItem({
  item,
  active,
  unreadCount,
}: {
  item: NavItem;
  active: boolean;
  unreadCount: number;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="relative flex flex-col items-center justify-center min-w-[60px] px-2 py-2 rounded-xl"
    >
      <div className={active ? 'text-primary' : 'text-muted-foreground'}>
        <Icon size={20} />
      </div>

      {unreadCount > 0 ? (
        <span className="absolute right-2 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
          {unreadCount}
        </span>
      ) : null}

      <span className={`mt-1 text-[10px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
        {item.name.split(' ')[0]}
      </span>
    </Link>
  );
});

export default function Navigation({
  children,
  userType = 'admin',
}: {
  children?: React.ReactNode;
  userType?: 'admin' | 'user';
}) {
  const pathname = usePathname();
  const { unreadTotal } = useChatUnread();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const isChatRoute = pathname === '/user/chat' || pathname === '/admin/chat';

  const navItems = useMemo(() => (userType === 'admin' ? adminNavItems : userNavItems), [userType]);

  useEffect(() => {
    setAccountMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!accountMenuRef.current) return;
      const target = event.target as Node;
      if (!accountMenuRef.current.contains(target)) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [accountMenuOpen]);

  const dashboardPath = userType === 'admin' ? '/admin/dashboard' : '/user/dashboard';

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === dashboardPath) e.preventDefault();
  };

  return (
<div className="min-h-dvh bg-background">
  <header className="sticky top-0 z-30 hidden border-b border-border bg-card/80 backdrop-blur-xl lg:block">
    <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-8">
        <Link href={dashboardPath} className="flex items-center gap-3" onClick={handleLogoClick}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background/80">
            <Image src="/logo.png" alt="Logo" width={26} height={26} />
          </div>

          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-foreground">Primal Power</h1>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          {navItems.map(item => (
            <DesktopTopNavItem
              key={item.href}
              item={item}
              active={isActivePath(pathname, item.href)}
              unreadCount={item.href.endsWith('/chat') ? unreadTotal : 0}
            />
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {userType === 'user' ? (
          <div ref={accountMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setAccountMenuOpen(v => !v)}
              aria-label="Open account menu"
              className="inline-flex items-center rounded-full border border-border bg-background/70 p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <User size={18} />
            </button>

            {accountMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur-xl">
                {userAccountMenuItems.map(item => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-background text-foreground'
                          : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
                      ].join(' ')}
                    >
                      <Icon size={15} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="hidden w-10 lg:block" />
        )}
      </div>
    </div>
  </header>

  <main
    className={cn(
      'mx-auto w-full max-w-[1600px]',
      isChatRoute
        ? [
            'h-[calc(100dvh-80px)]',
            'overflow-hidden',
            'pb-0',
            'lg:h-[calc(100dvh-80px)]',
            'lg:px-6',
            'lg:py-6',
          ]
        : [
            'min-h-[calc(100dvh-80px)]',
            'overflow-y-auto',
            'pb-24',
            'lg:min-h-[calc(100dvh-80px)]',
            'lg:px-6',
            'lg:py-6',
            'lg:pb-6',
          ]
    )}
  >
    {children ?? (
      <div id="page-content" className="flex min-h-[300px] items-center justify-center">
        <p className="text-center text-sm text-muted-foreground">
          Select an option from the navigation
        </p>
      </div>
    )}
  </main>

  <nav className="fixed bottom-0 left-0 right-0 pb-4 z-40 h-20 border-t border-border bg-card/95 shadow-lg backdrop-blur-lg lg:hidden">
    <div className="mx-auto flex h-full max-w-lg items-center justify-around px-2 py-2">
      {navItems.map(item => (
        <MobileTabItem
          key={item.href}
          item={item}
          active={isActivePath(pathname, item.href)}
          unreadCount={item.href.endsWith('/chat') ? unreadTotal : 0}
        />
      ))}
    </div>
  </nav>
</div>
  );
}
