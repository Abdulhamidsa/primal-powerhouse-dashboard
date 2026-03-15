'use client';

import { useMotivationNotification } from '@/hooks/useMotivationNotification';
import { useUserData } from '@/hooks/useUserData';
import React, { useState, useEffect } from 'react';
import { Activity, CalendarDays, MessageSquare, Sun, Cloud } from 'lucide-react';
import { SkeletonDashboard } from '@/components/Skeletons';
import { WeeklyCheckInCard } from '@/features/weekly-checkin/components/WeeklyCheckInCard';
import { DailyCheckInCard } from '@/features/daily-checkin/components/DailyCheckInCard';
import { DailyCheckInInsightsCard } from '@/features/daily-checkin/components/DailyCheckInInsightsCard';
import { DailyNutritionCard } from '@/features/daily-nutrition/components/DailyNutritionCard';
import { DailyTrainingCard } from '@/features/daily-training/components/DailyTrainingCard';

export default function UserDashboardPage() {
  const { user, error, isLoading } = useUserData();
  const [greeting, setGreeting] = useState({ text: '', icon: null as React.ReactNode });

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
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const coachMessage = user?.motivationalMessage || 'No coach message yet. Check back after your next review.';

  return (
    <div className="px-4 py-5 md:px-6 md:py-7">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="relative overflow-hidden rounded-[32px] border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-background to-amber-500/10 px-5 py-6 md:px-7 md:py-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-amber-500/15 blur-2xl" />

          <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                {greeting.icon && (
                  <div className="grid h-10 w-10 place-items-center rounded-full border border-sky-500/20 bg-background/80 text-sky-600">
                    {greeting.icon}
                  </div>
                )}
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {greeting.text}, {firstName}.
                </h1>
                <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
                  <CalendarDays size={14} />
                  {todayLabel}
                </div>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-foreground/80">
                Your dashboard is trimmed down for today: one clear check-in flow, your latest coach message, and the
                essentials that matter.
              </p>
            </div>

            <div className="rounded-3xl border border-amber-500/25 bg-background/85 p-5 shadow-sm backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
                  <MessageSquare size={18} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700/90">Coach Message</p>
                  <p className="text-sm leading-relaxed text-foreground">{coachMessage}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
          <section className="space-y-6">
            <div className="rounded-[32px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/8 via-background to-background p-4 md:p-5">
              <div className="mb-4 flex items-start justify-between gap-3 px-1">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700/90">
                    Daily Check-In
                  </p>
                  <p className="mt-1 text-sm text-foreground/75">
                    Keep today simple: log weight, compliance, and energy.
                  </p>
                </div>
                <div className="hidden rounded-full border border-emerald-500/20 bg-background/80 px-3 py-1 text-xs text-emerald-700 md:block">
                  3 quick actions
                </div>
              </div>

              <DailyCheckInCard />
            </div>

            <div className="rounded-[32px] border border-sky-500/20 bg-gradient-to-br from-sky-500/8 via-background to-background p-4 md:p-5">
              <div className="mb-4 flex items-start gap-3 px-1">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-sky-500/10 text-sky-600">
                  <Activity size={17} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700/90">Progress Snapshot</p>
                  <p className="mt-1 text-sm text-foreground/75">
                    Recent weight trend and completion context, without the extra noise.
                  </p>
                </div>
              </div>

              <DailyCheckInInsightsCard />
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-background to-background p-4 md:p-5">
              <div className="mb-4 px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700/90">Weekly Check-In</p>
                <p className="mt-1 text-sm text-foreground/75">
                  Your broader weekly review stays visible, but no longer fights the daily flow.
                </p>
              </div>

              <WeeklyCheckInCard />
            </div>

            <div className="rounded-[32px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/8 via-background to-background p-4 md:p-5">
              <div className="mb-4 px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700/90">
                  Additional Tracking
                </p>
                <p className="mt-1 text-sm text-foreground/75">
                  Optional nutrition and training logs, grouped together so the page stays readable.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <DailyNutritionCard />
                <DailyTrainingCard />
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
