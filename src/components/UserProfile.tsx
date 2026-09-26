'use client';

import { ChatCircleIcon, ClipboardTextIcon, ForkKnifeIcon, UserIcon, UsersIcon } from '@phosphor-icons/react';
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
          <UserIcon className="w-10 h-10 text-primary-foreground" aria-hidden="true" focusable="false" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Welcome, {user.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Your personalized fitness journey starts here</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <ClipboardTextIcon className="w-6 h-6 text-primary" aria-hidden="true" focusable="false" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Nutrition Plan</h3>
          <p className="text-sm text-muted-foreground">Customized meal options</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <ForkKnifeIcon className="w-6 h-6 text-primary" aria-hidden="true" focusable="false" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Training Videos</h3>
          <p className="text-sm text-muted-foreground">Professional workouts</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <UsersIcon className="w-6 h-6 text-primary" aria-hidden="true" focusable="false" />
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
            <ClipboardTextIcon className="w-5 h-5 text-primary" aria-hidden="true" focusable="false" />
            <span className="text-foreground font-medium">View Meal Plan</span>
          </button>

          <button className="flex items-center gap-3 p-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
            <ForkKnifeIcon className="w-5 h-5 text-primary" aria-hidden="true" focusable="false" />
            <span className="text-foreground font-medium">Watch Videos</span>
          </button>

          {user.coach && (
            <button className="flex items-center gap-3 p-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors sm:col-span-2">
              <ChatCircleIcon className="w-5 h-5 text-primary" aria-hidden="true" focusable="false" />
              <span className="text-foreground font-medium">Contact Coach</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
