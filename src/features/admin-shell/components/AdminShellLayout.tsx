'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext } from 'react';
import type { Icon } from '@phosphor-icons/react';
import {
  BarbellIcon,
  ChatCircleDotsIcon,
  ForkKnifeIcon,
  GearSixIcon,
  GaugeIcon,
  HandshakeIcon,
  ListChecksIcon,
  MagnifyingGlassIcon,
  PlayCircleIcon,
  SidebarSimpleIcon,
  SignOutIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useAdminLogout } from '@/features/admin-shell/hooks/useAdminLogout';

type AdminNavItem = {
  name: string;
  href: string;
  icon: Icon;
  description: string;
};

const adminNavItems: AdminNavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: GaugeIcon, description: 'Command center' },
  { name: 'Clients', href: '/admin/clients', icon: UsersThreeIcon, description: 'Client workspace' },
  { name: 'Training', href: '/admin/training', icon: BarbellIcon, description: 'Exercises & plans' },
  { name: 'Meals', href: '/admin/meals', icon: ForkKnifeIcon, description: 'Meal library' },
  { name: 'Chat', href: '/admin/chat', icon: ChatCircleDotsIcon, description: 'Coach inbox' },
  { name: 'Deals', href: '/admin/deals', icon: HandshakeIcon, description: 'Pipeline' },
  { name: 'Videos', href: '/admin/videos', icon: PlayCircleIcon, description: 'Exercise media' },
  { name: 'Legacy Workouts', href: '/admin/workout-plans', icon: ListChecksIcon, description: 'Old plan library' },
  { name: 'Settings', href: '/admin/settings', icon: GearSixIcon, description: 'Appearance' },
];

const AdminIdentityContext = createContext<string | null>(null);

export function useAdminUserId(): string {
  const userId = useContext(AdminIdentityContext);
  if (!userId) throw new Error('useAdminUserId must be used inside AdminShellLayout');
  return userId;
}

function isActivePath(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(href + '/');
}

function AdminSidebarItem({ item, active }: { item: AdminNavItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      prefetch={false}
      className={cn(
        'group flex items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-colors',
        active
          ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent-muted)] text-foreground'
          : 'border-transparent text-muted-foreground hover:border-border hover:bg-card hover:text-foreground',
      )}
    >
      <Icon
        size={18}
        weight={active ? 'fill' : 'regular'}
        aria-hidden="true"
        className={cn(
          'shrink-0',
          active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
        )}
      />
      <span className="min-w-0">
        <span className="block truncate font-medium">{item.name}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{item.description}</span>
      </span>
    </Link>
  );
}

export function AdminShellLayout({
  userId,
  children,
  notificationBanner,
}: {
  userId: string;
  children: React.ReactNode;
  notificationBanner?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useAdminLogout();

  return (
    <div
      className="flex h-dvh overflow-hidden bg-background text-foreground"
    >
      <AdminIdentityContext.Provider value={userId}>
      <aside className="hidden w-[284px] shrink-0 border-r border-border bg-background px-4 py-5 lg:flex lg:flex-col">
        <Link href="/admin/dashboard" prefetch={false} className="mb-6 flex items-center gap-3 rounded-lg px-2 py-1">
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-card">
            <Image src="/logo.png" alt="Primal Power" width={26} height={26} />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-[0.24em] text-foreground">PRIMAL</span>
            <span className="block text-xs text-muted-foreground">Coach admin</span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1.5">
          {adminNavItems.map(item => (
            <AdminSidebarItem key={item.href} item={item} active={isActivePath(pathname, item.href)} />
          ))}
        </nav>

        <button
          type="button"
          onClick={logout}
          disabled={isLoggingOut}
          className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-[var(--color-surface-hover)] hover:text-foreground disabled:opacity-60"
        >
          <SignOutIcon size={17} aria-hidden="true" />
          {isLoggingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[64px] shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card lg:hidden">
              <SidebarSimpleIcon size={18} aria-hidden="true" className="text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Admin workspace
              </p>
              <p className="truncate text-sm text-muted-foreground">Coaching operations</p>
            </div>
          </div>

          <div className="hidden min-w-[260px] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground md:flex">
            <MagnifyingGlassIcon size={15} aria-hidden="true" />
            <span>Use page search and filters</span>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>

      {notificationBanner}
      </AdminIdentityContext.Provider>
    </div>
  );
}
