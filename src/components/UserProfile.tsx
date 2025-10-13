'use client';

import { useState, useEffect } from 'react';

interface UserProfileProps {
  userId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  coach?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export default function UserProfile({ userId }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/auth/me`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <span className="ml-3 text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load profile information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Welcome, {user.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Your personalized fitness journey starts here</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-foreground mb-1">Nutrition Plan</h3>
          <p className="text-sm text-muted-foreground">Customized meal options</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-foreground mb-1">Training Videos</h3>
          <p className="text-sm text-muted-foreground">Professional workouts</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-foreground mb-1">Coach Support</h3>
          <p className="text-sm text-muted-foreground">Expert guidance</p>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Profile Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-muted-foreground">Full Name</span>
            <span className="text-foreground font-medium">{user.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-muted-foreground">Email</span>
            <span className="text-foreground font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Member Status</span>
            <span className="bg-primary/20 text-primary px-2 py-1 rounded text-sm font-medium">Active</span>
          </div>
        </div>
      </div>

      {/* Coach Information */}
      {user.coach && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Coach</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Coach Name</span>
              <span className="text-foreground font-medium">{user.coach.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground font-medium">{user.coach.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Status</span>
              <span className="text-primary font-medium">Available</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button className="flex items-center gap-3 p-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="text-foreground font-medium">View Meal Plan</span>
          </button>

          <button className="flex items-center gap-3 p-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1M9 10v5a2 2 0 002 2h2a2 2 0 002-2v-5"
              />
            </svg>
            <span className="text-foreground font-medium">Watch Videos</span>
          </button>

          {user.coach && (
            <button className="flex items-center gap-3 p-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors sm:col-span-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-foreground font-medium">Contact Coach</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
