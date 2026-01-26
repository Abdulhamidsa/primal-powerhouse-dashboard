'use client';

import { useMotivationNotification } from '@/hooks/useMotivationNotification';
import { useUserData } from '@/hooks/useUserData';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Apple, UtensilsCrossed, Video, MessageSquare, Zap, Sun, Cloud } from 'lucide-react';
import { SkeletonDashboard } from '@/components/Skeletons';

const MOTIVATIONAL_QUOTES = [
  'The only bad workout is the one that did not happen.',
  "Your body can stand almost anything. It's your mind that you need to convince.",
  'Success is the sum of small efforts repeated day in and day out.',
  'Discipline is choosing between what you want now and what you want most.',
  "Don't stop when you're tired. Stop when you're done.",
  'Progress, not perfection.',
  'You are stronger than your excuses.',
  'Believe in the process.',
  'Every rep counts.',
  'Make it happen.',
];

export default function UserDashboardPage() {
  const { user, error, isLoading } = useUserData();
  const router = useRouter();
  const [dailyQuote, setDailyQuote] = useState('');
  const [greeting, setGreeting] = useState({ text: '', icon: null as React.ReactNode });

  console.log('User data:', user, 'Error:', error);

  useMotivationNotification(user?.motivationalMessage);

  useEffect(() => {
    // Get current time in Denmark timezone
    const denmarkTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' });
    const hour = new Date(denmarkTime).getHours();

    let greetingData = { text: '', icon: null as React.ReactNode };
    if (hour >= 5 && hour < 12) {
      greetingData = { text: 'Good Morning', icon: <Sun className="w-6 h-6" /> };
    } else if (hour >= 12 && hour < 17) {
      greetingData = { text: 'Good Afternoon', icon: <Cloud className="w-6 h-6" /> };
    } else {
      greetingData = { text: 'Good Evening', icon: <Sun className="w-6 h-6" /> };
    }
    setGreeting(greetingData);

    // Get a quote based on today's date (same quote all day)
    const today = new Date().toDateString();
    const savedQuote = localStorage.getItem('dailyQuote');
    const savedDate = localStorage.getItem('quoteDate');

    if (savedDate === today && savedQuote) {
      setDailyQuote(savedQuote);
    } else {
      const randomQuote = MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length];
      setDailyQuote(randomQuote);
      localStorage.setItem('dailyQuote', randomQuote);
      localStorage.setItem('quoteDate', today);
    }
  }, []);

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  if (error) {
    return (
      <div className="px-4 py-6 md:px-6">
        <div className="rounded-3xl border border-destructive bg-destructive/5 p-6">
          <p className="text-destructive font-medium">Error loading dashboard</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
          <p className="text-sm text-muted-foreground">Please make sure you are logged in.</p>
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'Member';

  return (
    <div className="px-4 py-6 md:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {greeting.icon && <div className="w-8 h-8 text-accent">{greeting.icon}</div>}
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {greeting.text}, {firstName}!
            </h1>
          </div>
          <p className="text-muted-foreground">Welcome back to your fitness journey</p>
        </div>

        {/* Daily Motivation Quote */}
        <div className="rounded-3xl border border-border bg-gradient-to-br from-accent/10 to-background p-6">
          <div className="flex items-start gap-3">
            <Zap className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm font-medium text-accent mb-2">Today&apos;s Motivation</p>
              <p className="text-lg font-semibold text-foreground leading-relaxed">&quot;{dailyQuote}&quot;</p>
            </div>
          </div>
        </div>

        {/* Coach Message */}
        {user?.motivationalMessage && (
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-6 h-6 text-foreground/60 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Message from your coach</p>
                <p className="text-foreground leading-relaxed">{user.motivationalMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/user/meals')}
            className="group rounded-3xl border border-border bg-card p-6 text-left transition-all hover:border-accent hover:shadow-md active:scale-95"
          >
            <div className="flex items-center justify-between mb-2">
              <UtensilsCrossed className="w-6 h-6 text-foreground/60 group-hover:text-accent transition-colors" />
              <span className="text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </div>
            <h3 className="font-semibold text-foreground">My Meals</h3>
            <p className="text-xs text-muted-foreground mt-1">View your meal plans</p>
          </button>

          <button
            onClick={() => router.push('/user/training')}
            className="group rounded-3xl border border-border bg-card p-6 text-left transition-all hover:border-accent hover:shadow-md active:scale-95"
          >
            <div className="flex items-center justify-between mb-2">
              <Video className="w-6 h-6 text-foreground/60 group-hover:text-accent transition-colors" />
              <span className="text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </div>
            <h3 className="font-semibold text-foreground">Training</h3>
            <p className="text-xs text-muted-foreground mt-1">View your workouts</p>
          </button>

          <button
            onClick={() => router.push('/user/profile')}
            className="group rounded-3xl border border-border bg-card p-6 text-left transition-all hover:border-accent hover:shadow-md active:scale-95 md:col-span-2"
          >
            <div className="flex items-center justify-between mb-2">
              <Apple className="w-6 h-6 text-foreground/60 group-hover:text-accent transition-colors" />
              <span className="text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </div>
            <h3 className="font-semibold text-foreground">Profile</h3>
            <p className="text-xs text-muted-foreground mt-1">Manage your info</p>
          </button>
        </div>

        {/* Motivational Banner */}
        <div className="rounded-3xl border border-border bg-gradient-to-r from-accent/5 via-transparent to-accent/5 p-6 text-center">
          <p className="text-sm text-foreground/70">
            <span className="font-semibold text-foreground">Every action you take</span> brings you closer to your
            goals. You&apos;ve got this!
          </p>
        </div>
      </div>
    </div>
  );
}
