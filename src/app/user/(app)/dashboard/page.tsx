'use client';

import { useMotivationNotification } from '@/hooks/useMotivationNotification';
import { useUserData } from '@/hooks/useUserData';
import React, { useState, useEffect } from 'react';
import { CalendarDays, MessageSquare, Moon, Sun } from 'lucide-react';
import { SkeletonDashboard } from '@/components/Skeletons';
import { WeeklyCheckInCard } from '@/features/weekly-checkin/components/WeeklyCheckInCard';
import { DailyCheckInCard } from '@/features/daily-checkin/components/DailyCheckInCard';
import { DailyCheckInInsightsCard } from '@/features/daily-checkin/components/DailyCheckInInsightsCard';

export default function UserDashboardPage() {
  const { user, error, isLoading } = useUserData();
  const [greeting, setGreeting] = useState({ text: '', icon: null as React.ReactNode });

  useMotivationNotification(user?.motivationalMessage);

  useEffect(() => {
    const denmarkTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' });
    const hour = new Date(denmarkTime).getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting({ text: 'Good Morning', icon: <Sun size={18} /> });
    } else if (hour >= 12 && hour < 18) {
      setGreeting({ text: 'Good Afternoon', icon: <Sun size={18} /> });
    } else {
      setGreeting({ text: 'Good Evening', icon: <Moon size={18} /> });
    }
  }, []);

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  if (error) {
    return (
      <div className="px-4 py-6">
        <div className="rounded-3xl border border-destructive bg-destructive/5 p-6">
          <p className="font-medium text-destructive">Error loading dashboard</p>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'Member';
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const coachMessage = user?.motivationalMessage || 'No coach message yet. Check back after your next review.';

  return (
    <div className="px-4 pb-10 pt-5 md:px-5">
      <div className="mx-auto w-full max-w-xl space-y-5">
        {/* ── Header ── */}
        <header className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{todayLabel}</p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
                {greeting.text}, {firstName}
              </h1>
            </div>
            {greeting.icon && (
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground">
                {greeting.icon}
              </div>
            )}
          </div>

          {/* Coach message */}
          <div className="flex gap-3 rounded-2xl border border-border/70 bg-card p-4">
            <MessageSquare size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-sm leading-relaxed text-foreground/85">{coachMessage}</p>
          </div>
        </header>

        {/* ── Weekly ── */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Weekly Check-In</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays size={12} />
              <span>This week</span>
            </div>
          </div>
          <WeeklyCheckInCard />
        </section>

        {/* ── Daily Check-In ── */}
        <section className="space-y-2.5">
          <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Daily Check-In</p>
          <DailyCheckInCard />
        </section>

        {/* ── Progress ── */}
        <section className="space-y-2.5">
          <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Progress</p>
          <DailyCheckInInsightsCard />
        </section>
      </div>
    </div>
  );
}
