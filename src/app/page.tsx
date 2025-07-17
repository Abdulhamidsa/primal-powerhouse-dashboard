"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { DataService, DashboardStats } from "@/services/dataService";

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const stats = await DataService.getDashboardStats();
        setDashboardStats(stats);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fallback stats for loading state
  const stats = dashboardStats
    ? {
        totalClients: dashboardStats.totalClients,
        activeMealPlans: dashboardStats.activeClients,
        totalMeals: dashboardStats.totalMeals,
        weeklyGoals: dashboardStats.thisMonth.newClients,
      }
    : {
        totalClients: 0,
        activeMealPlans: 0,
        totalMeals: 0,
        weeklyGoals: 0,
      };

  const recentActivity =
    dashboardStats?.recentActivity.map((activity) => ({
      id: activity.id,
      action: activity.description,
      client: activity.clientName || "System",
      time: new Date(activity.timestamp).toLocaleDateString(),
      type: activity.type.includes("workout") ? "workout" : activity.type.includes("meal") ? "meal" : activity.type.includes("client") ? "client" : "goal",
    })) || [];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "client":
        return "👤";
      case "meal":
        return "🍽️";
      case "workout":
        return "💪";
      case "goal":
        return "🎯";
      default:
        return "📊";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-2">{getGreeting()}, Coach! 👋</h1>
                  <p className="text-xl text-blue-100 mb-4">Welcome to your Primal Powerhouse Dashboard</p>
                  <p className="text-blue-200">
                    {currentTime.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="mt-6 md:mt-0">
                  <div className="text-6xl md:text-8xl opacity-20">🏋️‍♂️</div>
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full"></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Total Clients",
              value: loading ? "..." : stats.totalClients,
              icon: "👥",
              color: "bg-blue-500",
              growth: dashboardStats ? `+${dashboardStats.growth.clientGrowth}%` : "",
            },
            {
              title: "Active Clients",
              value: loading ? "..." : stats.activeMealPlans,
              icon: "🔥",
              color: "bg-green-500",
              growth: dashboardStats ? `${dashboardStats.activeClients}/${dashboardStats.totalClients}` : "",
            },
            {
              title: "Total Meals",
              value: loading ? "..." : stats.totalMeals,
              icon: "🍽️",
              color: "bg-orange-500",
              growth: loading ? "" : `${stats.totalMeals} recipes`,
            },
            {
              title: "This Month",
              value: loading ? "..." : stats.weeklyGoals,
              icon: "🎯",
              color: "bg-purple-500",
              growth: dashboardStats ? `${dashboardStats.thisMonth.newClients} new clients` : "",
            },
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">{stat.title}</h3>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-green-600 font-medium">{stat.growth}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">⚡</span>
                Quick Actions
              </h2>
              <div className="space-y-4">
                <a href="/meals" className="flex items-center p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 group">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <span className="text-white text-xl">🍽️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Manage Meals</h3>
                    <p className="text-sm text-gray-600">Add or edit meal plans</p>
                  </div>
                </a>

                <a href="/clients" className="flex items-center p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-200 group">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <span className="text-white text-xl">👥</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Client Portal</h3>
                    <p className="text-sm text-gray-600">View and manage clients</p>
                  </div>
                </a>

                <button className="w-full flex items-center p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 group">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                    <span className="text-white text-xl">📊</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Analytics</h3>
                    <p className="text-sm text-gray-600">View performance metrics</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">📈</span>
                Recent Activity
              </h2>
              <div className="space-y-4">
                {loading ? (
                  // Loading skeleton
                  [...Array(3)].map((_, index) => (
                    <div key={index} className="flex items-center p-4 rounded-xl border border-gray-100">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse mr-4"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      </div>
                      <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))
                ) : recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-lg">{getActivityIcon(activity.type)}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{activity.action}</h3>
                        <p className="text-sm text-gray-600">{activity.client}</p>
                      </div>
                      <span className="text-sm text-gray-400">{activity.time}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl mb-4 block">📊</span>
                    <p>No recent activity to show</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
