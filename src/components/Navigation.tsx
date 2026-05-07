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
  Activity,
  Flame,
  User,
  Shield,
  MessageSquare,
  ClipboardCheck,
  CalendarCheck2,
  ShoppingBag,
  Handshake,
  Dumbbell,
} from 'lucide-react';
import { useChatUnread } from '@/features/client-coach-messaging/hooks/useChatUnread';
import { ChatDrawer } from '@/features/client-coach-messaging/components/ChatDrawer';
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
  {
    name: 'Deals',
    href: '/admin/deals',
    icon: Handshake,
    description: 'Client pipeline',
  },
  {
    name: 'Workoutsddd',
    href: '/admin/workout-plans',
    icon: Dumbbell,
    description: 'Workout plan library',
  },
  {
    name: 'Training',
    href: '/admin/training',
    icon: Activity,
    description: 'New training system',
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
    name: 'Training',
    href: '/user/training',
    icon: Activity,
    description: 'New training system',
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
        'relative flex min-w-0 flex-col items-center justify-center rounded-xl px-1 py-1.5 transition-colors',
        active ? 'bg-background/85 shadow-sm' : 'hover:bg-background/45',
      )}
    >
      <div className={active ? 'text-primary' : 'text-muted-foreground'}>
        <Icon size={18} />{' '}
      </div>

      {unreadCount > 0 ? (
        <span className="absolute right-2 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
          {unreadCount}
        </span>
      ) : null}

      <span
        className={`mt-0.5 max-w-full truncate text-[9px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}
      >
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
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const isChatRoute = pathname === '/user/chat' || pathname === '/admin/chat';

  const navItems = useMemo(() => (userType === 'admin' ? adminNavItems : userNavItems), [userType]);
  const safeNavItems = isMounted ? navItems : [];
  const safeUnreadTotal = isMounted ? unreadTotal : 0;
  const safeUser = isMounted ? user : null;

  useEffect(() => {
    setAccountMenuOpen(false);
    setChatDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    <div
      className={cn(
        'bg-background',
        isChatRoute ? 'flex h-dvh flex-col overflow-hidden' : 'flex h-dvh flex-col overflow-hidden',
      )}
    >
      {' '}
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

            <nav
              className="shrink-0 border-t border-border bg-card/95 shadow-lg backdrop-blur-lg lg:hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="mx-auto grid h-16 max-w-lg grid-cols-6 items-center px-2 pt-1">
                {safeNavItems.map(item => (
                  <MobileTabItem
                    key={item.href}
                    item={item}
                    active={isActivePath(pathname, item.href)}
                    unreadCount={item.href.endsWith('/chat') ? safeUnreadTotal : 0}
                  />
                ))}
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {userType === 'user' ? (
              <>
                <button
                  type="button"
                  onClick={() => setChatDrawerOpen(true)}
                  aria-label="Open chat"
                  className="relative inline-flex items-center rounded-full border border-border bg-background/70 p-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <MessageSquare size={18} />
                  {safeUnreadTotal > 0 ? (
                    <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      {safeUnreadTotal}
                    </span>
                  ) : null}
                </button>

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
                {safeUnreadTotal > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                ) : null}
              </Link>

              <Link
                href="/user/profile"
                aria-label="Open profile"
                className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border/80 bg-background/70 text-muted-foreground transition-colors hover:text-foreground"
              >
                {safeUser?.avatar ? (
                  <Image
                    src={safeUser.avatar}
                    alt={safeUser.name ?? 'Profile'}
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
          'w-full flex-1 min-h-0 overflow-y-auto',
          isChatRoute ? 'overflow-hidden lg:px-6 lg:py-6' : 'pb-0',
        )}
      >
        {children ?? (
          <div id="page-content" className="flex min-h-[300px] items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">Select an option from the navigation</p>
          </div>
        )}
      </main>
      {!isChatRoute ? (
        <nav
          className="shrink-0 border-t border-border bg-card/95 shadow-lg backdrop-blur-lg lg:hidden"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto grid h-20 max-w-lg grid-cols-6 items-center px-2 py-2">
            {safeNavItems.map(item => (
              <MobileTabItem
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
                unreadCount={item.href.endsWith('/chat') ? safeUnreadTotal : 0}
              />
            ))}
          </div>
        </nav>
      ) : null}
      {userType === 'user' ? <ChatDrawer open={chatDrawerOpen} onClose={() => setChatDrawerOpen(false)} /> : null}
    </div>
  );
}
