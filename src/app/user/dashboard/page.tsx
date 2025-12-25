'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Quote, Dumbbell } from 'lucide-react';

interface UserData {
  name: string;
  motivationalMessage?: string;
}

export default function UserDashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
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
            Welcome back, {userData?.name?.split(' ')[0] || 'Member'}!
          </h1>
          <p className="text-muted-foreground">Your fitness journey awaits</p>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="bg-card p-8 rounded-lg border border-border">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Dumbbell className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            {userData?.motivationalMessage ? (
              <p className="text-lg text-foreground leading-relaxed">{userData.motivationalMessage}</p>
            ) : (
              <p className="text-lg text-foreground leading-relaxed">
                "The only bad workout is the one that didn't happen." - Unknown
              </p>
            )}
          </div>
          <p className="text-muted-foreground text-sm">Your coach has personalized everything for you.</p>
        </div>
      </div>
    </div>
  );
}
