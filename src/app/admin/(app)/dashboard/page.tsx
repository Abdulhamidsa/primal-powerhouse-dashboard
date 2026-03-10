'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { useChatUnread } from '@/features/client-coach-messaging/hooks/useChatUnread';

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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { unreadTotal } = useChatUnread();

  useEffect(() => {
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
  }, []);

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
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Chat</h3>
            <MessageSquare size={18} className="text-primary" />
          </div>
          <p className="text-2xl font-bold text-primary">{unreadTotal}</p>
          <p className="text-sm text-muted-foreground mb-3">Unread messages</p>
          <Link href="/admin/chat" className="text-primary hover:underline text-sm">
            Open Chat
          </Link>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Quick Actions</h3>
          <div className="space-y-2">
            <Link href="/admin/clients" className="block text-primary hover:underline">
              Manage Clients
            </Link>
            <Link href="/admin/chat" className="block text-primary hover:underline">
              Open Chat {unreadTotal > 0 ? `(${unreadTotal})` : ''}
            </Link>
            <Link href="/admin/meals" className="block text-primary hover:underline">
              Add New Meal
            </Link>
            <Link href="/admin/videos" className="block text-primary hover:underline">
              Upload Video
            </Link>
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
