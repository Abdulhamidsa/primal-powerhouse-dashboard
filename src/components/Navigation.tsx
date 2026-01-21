'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart2, Utensils, Users, Flame, Apple, Clock, BarChart, User } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
const adminNavItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: <BarChart2 size={20} />,
    description: 'Overview & stats',
  },
  {
    name: 'Meals',
    href: '/admin/meals',
    icon: <Utensils size={20} />,
    description: 'Manage meal library',
  },
  {
    name: 'Meal Planner',
    href: '/admin/meal-planner',
    icon: <Apple size={20} />,
    description: 'Create meal plans',
  },
  {
    name: 'Videos',
    href: '/admin/videos',
    icon: <Flame size={20} />,
    description: 'Training videos',
  },
  {
    name: 'Clients',
    href: '/admin/clients',
    icon: <Users size={20} />,
    description: 'Client management',
  },
];

const userNavItems = [
  {
    name: 'Dashboard',
    href: '/user/dashboard',
    icon: <BarChart2 size={20} />,
    description: 'Overview',
  },
  {
    name: 'Meals',
    href: '/user/meals',
    icon: <Utensils size={20} />,
    description: 'Meal plans',
  },
  {
    name: 'Training',
    href: '/user/training',
    icon: <Flame size={20} />,
    description: 'Workout videos',
  },
  {
    name: 'Profile',
    href: '/user/profile',
    icon: <User size={20} />,
    description: 'My profile',
  },
];

export default function Navigation({
  children,
  userType = 'admin',
}: {
  children?: React.ReactNode;
  userType?: 'admin' | 'user';
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Select nav items based on user type
  const navItems = userType === 'admin' ? adminNavItems : userNavItems;

  // Check if on mobile device
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Close mobile menu when path changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent unnecessary navigation when clicking logo on current page
  const handleLogoClick = (e: React.MouseEvent) => {
    const dashboardPath = userType === 'admin' ? '/admin/dashboard' : '/user/dashboard';
    if (pathname === dashboardPath) {
      e.preventDefault();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Sidebar Navigation - Desktop Only */}
      <aside
        className={`h-screen lg:relative z-40 transition-all duration-300 ease-in-out hidden lg:flex
  ${collapsed ? 'w-20' : 'w-64'}
  bg-card/60 backdrop-blur-xl border-r border-border/70`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link
              href={userType === 'admin' ? '/admin/dashboard' : '/user/dashboard'}
              className="flex items-center"
              onClick={handleLogoClick}
            >
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
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <BarChart size={18} /> : <BarChart2 size={18} />}
            </button>
          </div>

          {/* Quick Search */}

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-2">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={[
                    'group relative flex items-center',
                    collapsed ? 'justify-center' : 'justify-between',
                    'px-4 py-3 mb-1 mx-2 rounded-2xl transition-all duration-200',
                    isActive
                      ? 'bg-background/60 border border-border/70 shadow-sm'
                      : 'hover:bg-muted/60 text-foreground',
                  ].join(' ')}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'w-full'}`}>
                    <div className={isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}>
                      {item.icon}
                    </div>

                    {!collapsed && (
                      <div className="ml-3 flex-1 min-w-0">
                        <div
                          className={['font-medium truncate', isActive ? 'text-foreground' : 'text-foreground'].join(
                            ' '
                          )}
                        >
                          {item.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                      </div>
                    )}
                  </div>

                  {!collapsed && (
                    <div className="flex items-center gap-2">
                      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="border-t border-border p-4 space-y-2">{/* Logout moved to Profile page */}</div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile Header - Simple Logo Only */}
        <header className="lg:hidden flex items-center justify-center p-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center space-x-2">
            <Link href="/" className="w-20 h-16 rounded-lg flex items-center justify-center cursor-pointer">
              <Image src="/logo.png" alt="Logo" width={100} height={80} />
            </Link>
            {/* <h1 className="font-bold text-lg text-foreground">Primal Power</h1> */}
          </div>
        </header>

        {/* Content Area - Extra padding bottom for mobile tab bar */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-background pb-24 lg:pb-6">
          {children || (
            <div id="page-content">
              <p className="text-center py-8 text-muted-foreground">Select an option from the navigation</p>
            </div>
          )}
        </main>

        {/* Bottom Tab Bar - Mobile Only (iOS/Android style) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-lg">
          <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto mb-6">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center justify-center min-w-[60px] py-2 px-2 rounded-xl"
                >
                  <div
                    className={`transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {item.icon}
                  </div>
                  <span
                    className={`text-[10px] font-medium mt-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {item.name.split(' ')[0]}
                  </span>
                </Link>
              );
            })}

            {/* Profile link moved to primary navigation */}
          </div>
        </nav>
      </div>
    </div>
  );
}
