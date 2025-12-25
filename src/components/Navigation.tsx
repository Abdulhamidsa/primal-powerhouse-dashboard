'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, Utensils, Users, Flame, Apple, Clock, BarChart } from 'lucide-react';

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
  {
    name: 'Schedule',
    href: '/admin/schedule',
    icon: <Clock size={20} />,
    description: 'Appointments',
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

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // Redirect to appropriate login page based on user type
      if (userType === 'admin') {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/user/login';
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Navigation */}
      <aside
        className={`h-screen lg:relative z-40 transition-all duration-300 ease-in-out bg-card border-r border-border
          ${collapsed ? 'w-20' : 'w-64'} 
          ${isMobile ? (mobileMenuOpen ? 'translate-x-0 fixed' : '-translate-x-full fixed') : ''}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
                <span className="text-lg font-bold">PP</span>
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
          <div className="p-4">
            {!collapsed ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground"
                />
                <Flame size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              </div>
            ) : (
              <button
                className="w-full flex items-center justify-center p-2 rounded-lg"
                style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)' }}
              >
                <Flame size={16} className="text-gray-400" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-2">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} 
                    px-4 py-3 mb-1 mx-2 rounded-lg transition-colors duration-200
                    ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'}`}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'w-full'}`}>
                    <div className={`${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{item.icon}</div>

                    {!collapsed && (
                      <div className="ml-3 flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs opacity-75">{item.description}</div>
                      </div>
                    )}
                  </div>

                  {!collapsed && isActive && <BarChart size={16} />}
                </Link>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="border-t border-border p-4 space-y-2">
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-2 py-2 rounded-lg text-destructive hover:bg-destructive/10`}
            >
              <Flame size={20} />
              {!collapsed && <span className="ml-3 font-medium">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card sticky top-0 z-20">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-foreground">
            {mobileMenuOpen ? (
              <BarChart2 size={24} />
            ) : (
              <div className="space-y-1">
                <div className="w-6 h-0.5 bg-foreground"></div>
                <div className="w-6 h-0.5 bg-foreground"></div>
                <div className="w-6 h-0.5 bg-foreground"></div>
              </div>
            )}
          </button>

          <div className="flex items-center space-x-1">
            <div className="font-bold text-lg text-foreground">Primal Powerhouse</div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center ml-2 bg-primary text-primary-foreground">
              <span className="text-sm font-bold">PP</span>
            </div>
          </div>

          <button className="relative p-2 text-foreground">
            <Flame size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-background">
          {children || (
            <div id="page-content">
              {/* This div will be populated by your page content */}
              <p className="text-center py-8 text-muted-foreground">Select an option from the sidebar to get started</p>
            </div>
          )}
        </main>
      </div>

      {/* Mobile overlay */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
      )}
    </div>
  );
}
