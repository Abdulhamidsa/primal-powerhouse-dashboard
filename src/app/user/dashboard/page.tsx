'use client';

import { useState, useEffect } from 'react';

interface UserData {
  id: string;
  name: string;
  email: string;
  clientId: string;
  currentWeight?: number;
  goalWeight?: number;
  height?: number;
  age?: number;
  goals: string[];
  dietaryRestrictions: string[];
  fitnessLevel?: string;
  stats: {
    totalMealAssignments: number;
    totalVideoAssignments: number;
    thisWeekMeals: number;
    thisWeekVideos: number;
  };
  joinedAt: Date;
}

interface TodaysMeals {
  breakfast?: any;
  lunch?: any;
  dinner?: any;
  snack?: any;
}

export default function UserDashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [todaysMeals, setTodaysMeals] = useState<TodaysMeals>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
    fetchTodaysMeals();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/data');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchTodaysMeals = async () => {
    try {
      const response = await fetch('/api/user/meals/today');
      if (response.ok) {
        const data = await response.json();
        setTodaysMeals(data);
      }
    } catch (error) {
      console.error("Error fetching today's meals:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {userData?.name?.split(' ')[0] || 'Member'}! 👋
          </h1>
          <p className="text-muted-foreground">Track your fitness journey</p>
        </div>
      </div>

      {/* User stats - Removed sensitive information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Today's Focus</h3>
          <p className="text-2xl font-bold text-primary">Stay Consistent</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Motivation</h3>
          <p className="text-2xl font-bold text-primary">You've Got This!</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Next Step</h3>
          <p className="text-xl font-bold text-primary">Check Your Meals</p>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-2 text-foreground">Keep Going</h3>
          <p className="text-2xl font-bold text-primary">One Day at a Time</p>
        </div>
      </div>

      {/* Weekly stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <h4 className="font-medium mb-2 text-foreground">This Week's Meals</h4>
          <p className="text-lg font-bold text-primary">{userData?.stats.thisWeekMeals || 0}</p>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border">
          <h4 className="font-medium mb-2 text-foreground">This Week's Workouts</h4>
          <p className="text-lg font-bold text-primary">{userData?.stats.thisWeekVideos || 0}</p>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border">
          <h4 className="font-medium mb-2 text-foreground">Total Meals</h4>
          <p className="text-lg font-bold text-primary">{userData?.stats.totalMealAssignments || 0}</p>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border">
          <h4 className="font-medium mb-2 text-foreground">Total Workouts</h4>
          <p className="text-lg font-bold text-primary">{userData?.stats.totalVideoAssignments || 0}</p>
        </div>
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-4 text-foreground">Today's Meals</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-foreground">Breakfast</span>
              <span className={todaysMeals.breakfast ? 'text-primary' : 'text-muted-foreground'}>
                {todaysMeals.breakfast ? '✓ Assigned' : 'Not assigned'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground">Lunch</span>
              <span className={todaysMeals.lunch ? 'text-primary' : 'text-muted-foreground'}>
                {todaysMeals.lunch ? '✓ Assigned' : 'Not assigned'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground">Dinner</span>
              <span className={todaysMeals.dinner ? 'text-primary' : 'text-muted-foreground'}>
                {todaysMeals.dinner ? '✓ Assigned' : 'Not assigned'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground">Snack</span>
              <span className={todaysMeals.snack ? 'text-primary' : 'text-muted-foreground'}>
                {todaysMeals.snack ? '✓ Assigned' : 'Not assigned'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="font-semibold mb-4 text-foreground">Daily Inspiration</h3>
          <div className="space-y-3">
            <blockquote className="text-foreground italic">
              "The only bad workout is the one that didn't happen."
            </blockquote>
            <p className="text-muted-foreground text-sm">- Unknown</p>
            <div className="pt-2">
              <p className="text-primary font-medium">💪 Keep pushing forward!</p>
              <p className="text-muted-foreground text-sm">Your coach has personalized everything for you.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
