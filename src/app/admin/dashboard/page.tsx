'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalMeals: number;
  totalWorkouts: number;
  totalVideos: number;
  thisMonthClients: number;
  thisMonthWorkouts: number;
  upcomingSessions: number;
  recentWorkouts: any[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check-auth');
        if (!response.ok) {
          router.push('/admin/login');
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/admin/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, authLoading]);

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your fitness business</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const calculateEngagementRate = () => {
    if (!stats || stats.totalClients === 0) return 0;
    return Math.round((stats.activeClients / stats.totalClients) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your fitness business</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your fitness business</p>
        </div>
      </div>

      {/* Admin Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Total Clients</h3>
          <p className="text-2xl font-bold text-primary">{stats?.totalClients || 0}</p>
          <p className="text-sm text-muted-foreground">+{stats?.thisMonthClients || 0} this month</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Active Clients</h3>
          <p className="text-2xl font-bold text-primary">{stats?.activeClients || 0}</p>
          <p className="text-sm text-muted-foreground">{calculateEngagementRate()}% engagement</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Total Meals</h3>
          <p className="text-2xl font-bold text-primary">{stats?.totalMeals || 0}</p>
          <p className="text-sm text-muted-foreground">Recipe library</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Videos</h3>
          <p className="text-2xl font-bold text-primary">{stats?.totalVideos || 0}</p>
          <p className="text-sm text-muted-foreground">Training content</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Quick Actions</h3>
          <div className="space-y-2">
            <a href="/admin/clients" className="block text-primary hover:underline">
              Manage Clients
            </a>
            <a href="/admin/meals" className="block text-primary hover:underline">
              Add New Meal
            </a>
            <a href="/admin/videos" className="block text-primary hover:underline">
              Upload Video
            </a>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Recent Workouts</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            {stats?.recentWorkouts && stats.recentWorkouts.length > 0 ? (
              stats.recentWorkouts.slice(0, 3).map((workout, idx) => (
                <p key={idx}>
                  • {workout.client?.name || 'Client'} - {workout.type}
                </p>
              ))
            ) : (
              <p>No recent workouts</p>
            )}
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Activity Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">This Month Workouts:</span>
              <span className="text-foreground font-semibold">{stats?.thisMonthWorkouts || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Upcoming Sessions:</span>
              <span className="text-foreground font-semibold">{stats?.upcomingSessions || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">System Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-foreground">Database: Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-foreground">API: Healthy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
