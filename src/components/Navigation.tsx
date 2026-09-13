'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
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
import { ChatDrawer } from '@/features/client-coach-messaging/components/ChatDrawer.tsx';
import { cn } from '@/lib/utils';
import { useThemePreference } from '@/features/theme-preference/hooks/useThemePreference';
import { useUserDashboardSummary } from '@/features/user-dashboard/hooks/useUserDashboardSummary';

const LazyChatDrawer = dynamic<{ open: boolean; onClose: () => void }>(() => Promise.resolve(ChatDrawer), {
  ssr: false,
  loading: () => null,
});

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
    name: 'Today',
    mobileName: 'Today',
    href: '/user/dashboard',
    icon: BarChart2,
    description: 'Your day at a glance',
  },
  {
    name: 'Plan',
    mobileName: 'Plan',
    href: '/user/my-plan',
    icon: CalendarCheck2,
    description: 'Meals and swaps',
  },
  {
    name: 'Check-Ins',
    mobileName: 'Check-ins',
    href: '/user/check-ins',
    icon: ClipboardCheck,
    description: 'Daily and weekly tracking',
  },
  // Temporarily hidden to simplify the mobile dock.
  // {
  //   name: 'Program',
  //   href: '/user/program',
  //   icon: Utensils,
  //   description: 'Meals & training',
  // },
  {
    name: 'Training',
    mobileName: 'Train',
    href: '/user/training',
    icon: Activity,
    description: 'Workout plans and videos',
  },
  {
    name: 'Shopping',
    mobileName: 'Shop',
    href: '/user/shopping-list',
    icon: ShoppingBag,
    description: 'Groceries and prep',
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
  pending,
  unreadCount,
  tabRef,
  onPrime,
}: {
  item: NavItem;
  active: boolean;
  pending: boolean;
  unreadCount: number;
  tabRef: (node: HTMLAnchorElement | null) => void;
  onPrime: (href: string) => void;
}) {
  const Icon = item.icon;
  const visuallyActive = active || pending;

  return (
    <Link
      href={item.href}
      ref={tabRef}
      prefetch
      onPointerEnter={() => onPrime(item.href)}
      onTouchStart={() => onPrime(item.href)}
      onMouseDown={() => onPrime(item.href)}
      className={cn(
        'relative flex h-full w-full min-w-0 flex-col items-center justify-center rounded-[22px] p-2 text-center transition-[transform,color,opacity] duration-300 ease-out active:scale-[0.98]',
        visuallyActive ? 'text-foreground' : 'text-muted-foreground/85 hover:text-foreground',
      )}
    >
      <div
        className={cn(
          'relative z-10 flex items-center justify-center transition-[transform,color] duration-300 ease-out',
          visuallyActive ? 'text-primary' : 'text-current',
        )}
        style={{ transform: visuallyActive ? 'translateY(-1px) scale(1.08)' : 'translateY(0) scale(1)' }}
      >
        <Icon size={21} />
      </div>

      {unreadCount > 0 ? (
        <span className="absolute right-2 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
          {unreadCount}
        </span>
      ) : null}

      <span
        className={cn(
          'relative z-10 mt-1 w-full max-w-full truncate text-[9px] font-medium leading-none transition-[transform,color] duration-300 ease-out',
          visuallyActive ? 'text-primary' : 'text-current',
        )}
        style={{ transform: visuallyActive ? 'translateY(-0.5px)' : 'translateY(0)' }}
      >
        {item.mobileName ?? item.name}
      </span>
      {pending && !active ? <span className="absolute top-2 h-1 w-1 rounded-full bg-primary" /> : null}
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
  const router = useRouter();
  const { summary: dashboardSummary } = useUserDashboardSummary(userType === 'user');
  useThemePreference({ enabled: userType === 'user' });
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const mobileTabRefs = useRef(new Map<string, HTMLAnchorElement | null>());
  const [mobileIndicator, setMobileIndicator] = useState({ x: 0, width: 0, ready: false });
  const isChatRoute = pathname === '/user/chat' || pathname === '/admin/chat';

  const navItems = useMemo(() => (userType === 'admin' ? adminNavItems : userNavItems), [userType]);
  const safeNavItems = navItems;
  const safeUnreadTotal = dashboardSummary?.unreadTotal ?? 0;
  const safeUser = isMounted ? (dashboardSummary?.user ?? null) : null;

  useEffect(() => {
    setAccountMenuOpen(false);
    setChatDrawerOpen(false);
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (userType !== 'user') return;
    const timeoutId = window.setTimeout(() => {
      userNavItems.forEach(item => router.prefetch(item.href));
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [router, userType]);

  const primeRoute = (href: string) => {
    if (href === pathname) return;
    setPendingHref(href);
    router.prefetch(href);
  };

  useLayoutEffect(() => {
    if (userType !== 'user') return;

    const updateIndicator = () => {
      const nav = mobileNavRef.current;
      const activeItem = navItems.find(item => item.href === pendingHref) ?? navItems.find(item => isActivePath(pathname, item.href));
      const activeLink = activeItem ? mobileTabRefs.current.get(activeItem.href) : null;

      if (!nav || !activeLink) return;

      const navRect = nav.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();

      setMobileIndicator({
        x: linkRect.left - navRect.left,
        width: linkRect.width,
        ready: true,
      });
    };

    const raf = window.requestAnimationFrame(updateIndicator);

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateIndicator);

      return () => {
        window.cancelAnimationFrame(raf);
        window.removeEventListener('resize', updateIndicator);
      };
    }

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(updateIndicator);
    });

    if (mobileNavRef.current) {
      observer.observe(mobileNavRef.current);
    }

    mobileTabRefs.current.forEach(link => {
      if (link) observer.observe(link);
    });

    window.addEventListener('resize', updateIndicator);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', updateIndicator);
    };
  }, [navItems, pathname, pendingHref, userType]);

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

            <nav className="hidden items-center gap-2 lg:flex">
              {safeNavItems.map(item => (
                <DesktopTopNavItem
                  key={item.href}
                  item={item}
                  active={isActivePath(pathname, item.href)}
                  unreadCount={item.href.endsWith('/chat') ? safeUnreadTotal : 0}
                />
              ))}
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
          className="sticky top-0 z-20 border-b border-border/70 bg-card/70 px-4 pb-2 pt-3 backdrop-blur-xl lg:hidden"
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
        data-app-scroll-main
        className={cn(
          'w-full flex-1 min-h-0 overflow-y-auto pb-28 lg:pb-0',
          isChatRoute ? 'overflow-hidden lg:px-6 lg:py-6' : '',
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
          className="fixed inset-x-3 bottom-6 z-40 mx-auto max-w-xl rounded-[28px] border border-border/70 bg-card/85 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:hidden"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          <div ref={mobileNavRef} className="relative grid grid-cols-5 items-stretch gap-1 px-2 py-2">
            <div
              aria-hidden="true"
              className="absolute inset-y-1 rounded-[22px] border transition-[transform,width,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                left: 7,
                width: Math.max(mobileIndicator.width - 16, 0),
                transform: `translate3d(${mobileIndicator.x}px, 0, 0)`,
                opacity: mobileIndicator.ready ? 1 : 0,
                background:
                  'radial-gradient(circle at 50% 15%, rgba(255,255,255,0.24), rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.04) 75%, rgba(255,255,255,0.02) 100%)',
                borderColor: 'rgba(255,255,255,0.10)',
                boxShadow: '0 12px 30px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.10)',
                willChange: 'transform, width, opacity',
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-[20px] blur-xl transition-[transform,width,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                left: 7,
                width: Math.max(mobileIndicator.width - 16, 0),
                transform: `translate3d(${mobileIndicator.x}px, 0, 0) scale(1.08)`,
                opacity: mobileIndicator.ready ? 0.45 : 0,
                background:
                  'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.16), rgba(255,255,255,0.05) 62%, transparent 100%)',
                willChange: 'transform, width, opacity',
              }}
            />
            {safeNavItems.map(item => (
              <MobileTabItem
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
                pending={pendingHref === item.href}
                unreadCount={item.href.endsWith('/chat') ? safeUnreadTotal : 0}
                onPrime={primeRoute}
                tabRef={node => {
                  mobileTabRefs.current.set(item.href, node);
                }}
              />
            ))}
          </div>
        </nav>
      ) : null}
      {userType === 'user' && chatDrawerOpen ? (
        <LazyChatDrawer open={chatDrawerOpen} onClose={() => setChatDrawerOpen(false)} />
      ) : null}
    </div>
  );
}
