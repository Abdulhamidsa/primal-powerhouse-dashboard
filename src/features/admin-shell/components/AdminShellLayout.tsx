'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart2,
  Dumbbell,
  Flame,
  Handshake,
  LogOut,
  MessageSquare,
  PanelLeft,
  Search,
  Utensils,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminLogout } from '@/features/admin-shell/hooks/useAdminLogout';

type AdminNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

const adminNavItems: AdminNavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart2, description: 'Command center' },
  { name: 'Clients', href: '/admin/clients', icon: Users, description: 'Client workspace' },
  { name: 'Training', href: '/admin/training', icon: Activity, description: 'Exercises & plans' },
  { name: 'Meals', href: '/admin/meals', icon: Utensils, description: 'Meal library' },
  { name: 'Chat', href: '/admin/chat', icon: MessageSquare, description: 'Coach inbox' },
  { name: 'Deals', href: '/admin/deals', icon: Handshake, description: 'Pipeline' },
  { name: 'Videos', href: '/admin/videos', icon: Flame, description: 'Exercise media' },
  { name: 'Legacy Workouts', href: '/admin/workout-plans', icon: Dumbbell, description: 'Old plan library' },
];

function isActivePath(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(href + '/');
}

function AdminSidebarItem({ item, active }: { item: AdminNavItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition-all duration-200',
        active
          ? 'border-[var(--color-accent)]/35 bg-[var(--color-accent-translucent)] text-foreground shadow-[0_12px_32px_rgba(0,0,0,0.22)]'
          : 'border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/[0.04] hover:text-foreground',
      )}
    >
      <span
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-colors',
          active
            ? 'border-[var(--color-accent)]/35 bg-[var(--color-accent-muted)] text-[var(--color-accent)]'
            : 'border-white/10 bg-white/[0.03] text-muted-foreground group-hover:text-foreground',
        )}
      >
        <Icon size={17} />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{item.name}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{item.description}</span>
      </span>
    </Link>
  );
}

export function AdminShellLayout({
  children,
  notificationBanner,
}: {
  children: React.ReactNode;
  notificationBanner?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useAdminLogout();

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--color-bg)] text-foreground">
      <aside className="hidden w-[284px] shrink-0 border-r border-white/10 bg-[rgba(10,10,12,0.82)] px-4 py-5 backdrop-blur-xl lg:flex lg:flex-col">
        <Link href="/admin/dashboard" className="mb-6 flex items-center gap-3 rounded-2xl px-2 py-1">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
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
          className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:opacity-60"
        >
          <LogOut size={17} />
          {isLoggingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[72px] shrink-0 items-center justify-between border-b border-white/10 bg-[rgba(12,12,14,0.78)] px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] lg:hidden">
              <PanelLeft size={18} className="text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                Admin workspace
              </p>
              <p className="truncate text-sm text-muted-foreground">Desktop-first coaching operations</p>
            </div>
          </div>

          <div className="hidden min-w-[260px] items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-muted-foreground md:flex">
            <Search size={15} />
            <span>Use page search and filters</span>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>

      {notificationBanner}
    </div>
  );
}
