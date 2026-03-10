'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { BarChart2, Utensils, Users, Flame, Apple, BarChart, User, Shield, Salad, MessageSquare } from 'lucide-react';
import { useChatUnread } from '@/features/client-coach-messaging/hooks/useChatUnread';

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
  //   name: 'Meal Planner',
  //   href: '/admin/meal-planner',
  //   icon: Apple,
  //   description: 'Create meal plans',
  // },
  {
    name: 'Ingredients',
    href: '/admin/ingredients',
    icon: Salad,
    description: 'Food catalog',
  },
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

const DesktopNavItem = React.memo(function DesktopNavItem({
  item,
  collapsed,
  active,
  unreadCount,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  unreadCount: number;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={[
        'group relative flex items-center',
        collapsed ? 'justify-center' : 'justify-between',
        'px-4 py-3 mb-1 mx-2 rounded-2xl transition-all duration-200',
        active ? 'bg-background/60 border border-border/70 shadow-sm' : 'hover:bg-muted/60 text-foreground',
      ].join(' ')}
    >
      <div className={`flex items-center ${collapsed ? '' : 'w-full'}`}>
        <div className={active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}>
          <Icon size={20} />
        </div>

        {!collapsed && (
          <div className="ml-3 flex-1 min-w-0">
            <div className={['font-medium truncate', active ? 'text-foreground' : 'text-foreground'].join(' ')}>
              {item.name}
            </div>
            <div className="text-xs text-muted-foreground truncate">{item.description}</div>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {unreadCount}
            </span>
          ) : null}
          {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
        </div>
      )}

      {collapsed && unreadCount > 0 ? (
        <span className="absolute right-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
          {unreadCount}
        </span>
      ) : null}
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
      className="relative flex flex-col items-center justify-center min-w-[60px] py-2 px-2 rounded-xl"
    >
      <div className={`transition-colors duration-200 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
        <Icon size={20} />
      </div>
      {unreadCount > 0 ? (
        <span className="absolute right-2 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
          {unreadCount}
        </span>
      ) : null}
      <span className={`text-[10px] font-medium mt-1 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
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
  const [collapsed, setCollapsed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const navItems = useMemo(() => (userType === 'admin' ? adminNavItems : userNavItems), [userType]);

  useEffect(() => {
    if (window.innerWidth < 1024) setCollapsed(true);
  }, []);

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
    <div className="flex h-screen overflow-hidden relative">
      <aside
        className={[
          'h-screen lg:relative z-40 transition-all duration-300 ease-in-out hidden lg:flex',
          collapsed ? 'w-20' : 'w-64',
          'bg-card/60 backdrop-blur-xl border-r border-border/70',
        ].join(' ')}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link href={dashboardPath} className="flex items-center" onClick={handleLogoClick}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground">
                <Image src="/logo.png" alt="Logo" width={24} height={24} />
              </div>
              {!collapsed && (
                <div className="ml-3">
                  <h1 className="font-bold text-lg text-foreground">Primal Power</h1>
                </div>
              )}
            </Link>

            <button
              className="lg:flex hidden items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setCollapsed(v => !v)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              type="button"
            >
              {collapsed ? <BarChart size={18} /> : <BarChart2 size={18} />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {navItems.map(item => (
              <DesktopNavItem
                key={item.href}
                item={item}
                collapsed={collapsed}
                active={isActivePath(pathname, item.href)}
                unreadCount={item.href.endsWith('/chat') ? unreadTotal : 0}
              />
            ))}
          </div>

          <div className="border-t border-border p-4 space-y-2" />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-0">
        <header
          className={[
            'flex items-center justify-between px-8 p-2 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20',
            userType === 'admin' ? 'lg:hidden' : '',
          ].join(' ')}
        >
          <div className="flex items-center gap-3">
            <Link href={dashboardPath} className="w-16 h-16 rounded-lg flex items-center justify-center cursor-pointer">
              <Image src="/logo.png" alt="Logo" width={80} height={80} />
            </Link>
          </div>

          {userType === 'user' ? (
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen(v => !v)}
                aria-label="Open account menu"
                className="inline-flex border rounded-full items-center p-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <User size={18} />
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-card p-1.5 shadow-lg">
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
                            ? 'bg-muted/60 text-foreground'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
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
            <div />
          )}
        </header>

        <main className="flex-1 overflow-y-auto lg:p-6 bg-background pb-24 lg:pb-6">
          {children || (
            <div id="page-content">
              <p className="text-center py-8 text-muted-foreground">Select an option from the navigation</p>
            </div>
          )}
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border shadow-lg">
          <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto mb-6">
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
    </div>
  );
}
