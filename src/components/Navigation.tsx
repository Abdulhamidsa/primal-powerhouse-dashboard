'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import type { Icon } from '@phosphor-icons/react';
import {
  BarbellIcon,
  BellIcon,
  BookOpenTextIcon,
  CalendarCheckIcon,
  CaretRightIcon,
  ChatCircleDotsIcon,
  ClipboardTextIcon,
  ForkKnifeIcon,
  GaugeIcon,
  HandshakeIcon,
  HouseIcon,
  KeyIcon,
  ListChecksIcon,
  PlayCircleIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SignOutIcon,
  UserCircleIcon,
  UsersThreeIcon,
  XIcon,
} from '@phosphor-icons/react';
import { ChatDrawer } from '@/features/client-coach-messaging/components/ChatDrawer.tsx';
import { cn } from '@/lib/utils';
import { useThemePreference } from '@/features/theme-preference/hooks/useThemePreference';
import { useUserDashboardSummary } from '@/features/user-dashboard/hooks/useUserDashboardSummary';
import { useUserLogout, useUserProfile } from '@/features/user-profile/hooks/useUserProfile';

const LazyChatDrawer = dynamic<{ open: boolean; onClose: () => void }>(() => Promise.resolve(ChatDrawer), {
  ssr: false,
  loading: () => null,
});

type NavItem = {
  name: string;
  mobileName?: string;
  href: string;
  icon: Icon;
  description: string;
};

const adminNavItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: GaugeIcon,
    description: 'Overview & stats',
  },
  {
    name: 'Meals',
    href: '/admin/meals',
    icon: ForkKnifeIcon,
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
    icon: PlayCircleIcon,
    description: 'Training videos',
  },
  {
    name: 'Chat',
    href: '/admin/chat',
    icon: ChatCircleDotsIcon,
    description: 'Realtime messaging',
  },
  {
    name: 'Clients',
    href: '/admin/clients',
    icon: UsersThreeIcon,
    description: 'Client management',
  },
  {
    name: 'Deals',
    href: '/admin/deals',
    icon: HandshakeIcon,
    description: 'Client pipeline',
  },
  {
    name: 'Workoutsddd',
    href: '/admin/workout-plans',
    icon: ListChecksIcon,
    description: 'Workout plan library',
  },
  {
    name: 'Training',
    href: '/admin/training',
    icon: BarbellIcon,
    description: 'New training system',
  },
];

const userNavItems: NavItem[] = [
  {
    name: 'Today',
    mobileName: 'Today',
    href: '/user/dashboard',
    icon: HouseIcon,
    description: 'Your day at a glance',
  },
  {
    name: 'Plan',
    mobileName: 'Plan',
    href: '/user/my-plan',
    icon: CalendarCheckIcon,
    description: 'Meals and swaps',
  },
  {
    name: 'Check-Ins',
    mobileName: 'Check-ins',
    href: '/user/check-ins',
    icon: ClipboardTextIcon,
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
    icon: BarbellIcon,
    description: 'Workout plans and videos',
  },
  {
    name: 'Shopping',
    mobileName: 'Shop',
    href: '/user/shopping-list',
    icon: ShoppingBagIcon,
    description: 'Groceries and prep',
  },
];

const selfServiceNavItems: NavItem[] = [
  userNavItems[0],
  { name: 'Meal Plan', mobileName: 'Plan', href: '/user/my-plan', icon: CalendarCheckIcon, description: 'Your starter meal plan' },
  { name: 'Training Plan', mobileName: 'Train', href: '/user/training', icon: BarbellIcon, description: 'Your starter training plan' },
  { name: 'Method', mobileName: 'Method', href: '/user/learn', icon: BookOpenTextIcon, description: 'Handbook and practical guidance' },
  userNavItems[4],
];

const userAccountMenuItems: NavItem[] = [
  {
    name: 'Profile',
    href: '/user/profile',
    icon: UserCircleIcon,
    description: 'Account details',
  },
  {
    name: 'Privacy & Data',
    href: '/user/privacy',
    icon: ShieldCheckIcon,
    description: 'Privacy & data',
  },
  {
    name: 'Account Security',
    href: '/user/settings/security',
    icon: KeyIcon,
    description: 'Password and login',
  },
  {
    name: 'Notifications',
    href: '/user/settings/notifications',
    icon: BellIcon,
    description: 'Message alerts',
  },
];

const selfServiceAccountMenuItems: NavItem[] = [
  userAccountMenuItems[0],
  userAccountMenuItems[1],
  userAccountMenuItems[2],
  { name: 'Upgrade', href: '/user/upgrade', icon: HandshakeIcon, description: 'Explore personal guidance' },
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
      <Icon size={18} weight={active ? 'fill' : 'regular'} aria-hidden="true" className={active ? 'text-primary' : ''} />
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
  onPrime,
}: {
  item: NavItem;
  active: boolean;
  pending: boolean;
  unreadCount: number;
  onPrime: (href: string) => void;
}) {
  const Icon = item.icon;
  const visuallyActive = active || pending;

  return (
    <Link
      href={item.href}
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
        <Icon size={24} weight={visuallyActive ? 'fill' : 'regular'} aria-hidden="true" />
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
  const { logout } = useUserLogout();
  const { user: profileUser } = useUserProfile({ enabled: userType === 'user' });
  const { summary: dashboardSummary } = useUserDashboardSummary(userType === 'user');
  useThemePreference({ enabled: userType === 'user' });
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const isChatRoute = pathname === '/user/chat' || pathname === '/admin/chat';

  const navItems = useMemo(
    () => userType === 'admin' ? adminNavItems : profileUser?.accessMode === 'SELF_SERVICE' ? selfServiceNavItems : userNavItems,
    [profileUser?.accessMode, userType],
  );
  const safeNavItems = navItems;
  const safeUnreadTotal = dashboardSummary?.unreadTotal ?? 0;
  const safeUser = isMounted ? (dashboardSummary?.user ?? null) : null;
  const isSelfService = userType === 'user' && profileUser?.accessMode === 'SELF_SERVICE';
  const accountMenuItems = isSelfService ? selfServiceAccountMenuItems : userAccountMenuItems;

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

  useEffect(() => {
    if (!accountMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!accountMenuRef.current) return;
      const target = event.target as Node;
      if (target instanceof Element && target.closest('[data-mobile-account-sheet]')) return;
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

  const handleSignOut = async () => {
    await logout();
    window.location.href = '/user/login';
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
                {!isSelfService ? <button
                  type="button"
                  onClick={() => setChatDrawerOpen(true)}
                  aria-label="Open chat"
                  className="relative inline-flex items-center rounded-full border border-border bg-background/70 p-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ChatCircleDotsIcon size={18} aria-hidden="true" />
                  {safeUnreadTotal > 0 ? (
                    <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      {safeUnreadTotal}
                    </span>
                  ) : null}
                </button> : null}

                <div ref={accountMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen(v => !v)}
                    aria-label="Open account menu"
                    className="inline-flex items-center rounded-full border border-border bg-background/70 p-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <UserCircleIcon size={18} aria-hidden="true" />
                  </button>

                  {accountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur-xl">
                      {accountMenuItems.map(item => {
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
      {userType === 'user' && !isChatRoute ? (
        <div
          className="sticky top-0 z-20 border-b border-border/70 bg-card/70 px-4 pb-2 pt-3 backdrop-blur-xl lg:hidden"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <div className="mx-auto flex w-full max-w-xl items-center justify-end">

            <div className="flex items-center gap-2">
              {!isSelfService ? <Link
                href="/user/chat"
                aria-label="Open chat"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-background/70 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChatCircleDotsIcon size={18} aria-hidden="true" />
                {safeUnreadTotal > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                ) : null}
              </Link> : null}

              <button
                type="button"
                onClick={() => setAccountMenuOpen(true)}
                aria-label="Open account menu"
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
                  <UserCircleIcon size={18} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {userType === 'user' && accountMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Account menu">
          <button
            type="button"
            aria-label="Close account menu"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setAccountMenuOpen(false)}
          />

          <div
            data-mobile-account-sheet
            className="absolute inset-x-0 bottom-0 rounded-t-[32px] border border-border/80 bg-card/95 px-4 pt-3 shadow-[0_-24px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/25" />

            <div className="mx-auto max-w-xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border/80 bg-background/70">
                  {safeUser?.avatar ? (
                    <Image
                      src={safeUser.avatar}
                      alt={safeUser.name ?? 'Profile'}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon size={22} aria-hidden="true" className="text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-foreground">{safeUser?.name ?? 'Your account'}</p>
                  <p className="truncate text-sm text-muted-foreground">Manage your settings</p>
                </div>

                <button
                  type="button"
                  onClick={() => setAccountMenuOpen(false)}
                  aria-label="Close"
                  className="grid h-10 w-10 place-items-center rounded-full border border-border/80 bg-background/60 text-muted-foreground"
                >
                  <XIcon size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="overflow-hidden rounded-3xl border border-border/70 bg-background/55">
                {accountMenuItems.map((item, index) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href.split('#')[0]);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setAccountMenuOpen(false)}
                      className={cn(
                        'flex min-h-[56px] items-center gap-3 px-4 py-3 transition-colors active:bg-muted/60',
                        active ? 'text-foreground' : 'text-muted-foreground',
                        index > 0 ? 'border-t border-border/60' : '',
                      )}
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-muted/45 text-foreground">
                        <Icon size={18} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">{item.name}</span>
                        <span className="block text-xs text-muted-foreground">{item.description}</span>
                      </span>
                      <CaretRightIcon size={17} aria-hidden="true" className="text-muted-foreground/70" />
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="mt-3 flex min-h-[56px] w-full items-center gap-3 rounded-3xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-left text-destructive transition-colors active:bg-destructive/10"
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-destructive/10">
                  <SignOutIcon size={18} aria-hidden="true" />
                </span>
                <span className="flex-1 text-sm font-semibold">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <main
        data-app-scroll-main
        className={cn(
          'w-full flex-1 min-h-0 overflow-y-auto',
          isChatRoute ? 'overflow-hidden' : 'pb-28 lg:pb-0',
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
          <div className="relative grid grid-cols-5 items-stretch gap-1 px-2 py-2">
            {safeNavItems.map(item => (
              <MobileTabItem
                key={item.href}
                item={item}
                active={isActivePath(pathname, item.href)}
                pending={pendingHref === item.href}
                unreadCount={item.href.endsWith('/chat') ? safeUnreadTotal : 0}
                onPrime={primeRoute}
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
