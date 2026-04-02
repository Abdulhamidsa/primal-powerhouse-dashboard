'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart2,
  Utensils,
  Users,
  Flame,
  User,
  Shield,
  MessageSquare,
  ClipboardCheck,
  CalendarCheck2,
  ShoppingBag,
} from 'lucide-react';
import { useChatUnread } from '@/features/client-coach-messaging/hooks/useChatUnread';
import { cn } from '@/lib/utils';
import { useUserData } from '@/hooks/useUserData';
import { useThemePreference } from '@/features/theme-preference/hooks/useThemePreference';

type NavItem = {
  name: string;
  mobileName?: string;
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
    name: 'Meal Plan',
    mobileName: 'Plan',
    href: '/user/my-plan',
    icon: CalendarCheck2,
    description: 'Selected meals',
  },
  {
    name: 'Check-Ins',
    href: '/user/check-ins',
    icon: ClipboardCheck,
    description: 'Weekly & daily tracking',
  },
  {
    name: 'Program',
    href: '/user/program',
    icon: Utensils,
    description: 'Meals & training',
  },
  {
    name: 'Shopping List',
    mobileName: 'Shopping',
    href: '/user/shopping-list',
    icon: ShoppingBag,
    description: 'Groceries & prep',
  },
];

const userAccountMenuItems: NavItem[] = [
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
      className={cn(
        'relative flex min-w-[60px] flex-col items-center justify-center rounded-xl px-2 py-2 transition-colors',
        active ? 'bg-background/85 shadow-sm' : 'hover:bg-background/45',
      )}
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
        {item.mobileName ?? item.name}
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
  const { user } = useUserData();
  useThemePreference({ enabled: userType === 'user' });
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
              <>
                <Link
                  href="/user/chat"
                  aria-label="Open chat"
                  className="relative inline-flex items-center rounded-full border border-border bg-background/70 p-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <MessageSquare size={18} />
                  {unreadTotal > 0 ? (
                    <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      {unreadTotal}
                    </span>
                  ) : null}
                </Link>

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
              </>
            ) : (
              <div className="hidden w-10 lg:block" />
            )}
          </div>
        </div>
      </header>

      {userType === 'user' ? (
        <div
          className="sticky top-0 z-20 border-b border-border bg-card/80 px-4 pb-2 pt-3 backdrop-blur-xl lg:hidden"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <div className="mx-auto flex w-full max-w-xl items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Primal Power</p>

            <div className="flex items-center gap-2">
              <Link
                href="/user/chat"
                aria-label="Open chat"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/70 text-muted-foreground transition-colors hover:text-foreground"
              >
                <MessageSquare size={18} />
                {unreadTotal > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                ) : null}
              </Link>

              <Link
                href="/user/profile"
                aria-label="Open profile"
                className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border/80 bg-background/70 text-muted-foreground transition-colors hover:text-foreground"
              >
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name ?? 'Profile'}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User size={18} />
                )}
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <main
        className={cn(
          'w-full',
          isChatRoute
            ? [
                'min-h-[calc(100dvh-96px)]',
                'overflow-hidden',
                'pb-0',
                'lg:h-[calc(100dvh-96px)]',
                'lg:min-h-0',
                'lg:px-6',
                'lg:py-6',
              ]
            : ['min-h-[calc(100dvh-96px)]', 'overflow-y-auto', 'pb-0', 'lg:min-h-[calc(100dvh-96px)]'],
        )}
      >
        {children ?? (
          <div id="page-content" className="flex min-h-[300px] items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">Select an option from the navigation</p>
          </div>
        )}

        {!isChatRoute ? (
          <div
            className="lg:hidden"
            style={{ height: 'calc(7rem + env(safe-area-inset-bottom))' }}
            aria-hidden="true"
          />
        ) : null}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 h-24 border-t border-border bg-card/95 shadow-lg backdrop-blur-lg lg:hidden"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
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
