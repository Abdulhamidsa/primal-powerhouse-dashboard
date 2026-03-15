'use client';

import { useMotivationNotification } from '@/hooks/useMotivationNotification';
import { useUserData } from '@/hooks/useUserData';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarDays, MessageSquare, Sparkles, Sun, Cloud } from 'lucide-react';
import { SkeletonDashboard } from '@/components/Skeletons';
import { WeeklyCheckInCard } from '@/features/weekly-checkin/components/WeeklyCheckInCard';
import { DailyCheckInCard } from '@/features/daily-checkin/components/DailyCheckInCard';
import { DailyCheckInInsightsCard } from '@/features/daily-checkin/components/DailyCheckInInsightsCard';
import { DailyNutritionCard } from '@/features/daily-nutrition/components/DailyNutritionCard';
import { DailyTrainingCard } from '@/features/daily-training/components/DailyTrainingCard';
import { useChatUnread } from '@/features/client-coach-messaging/hooks/useChatUnread';
import { ChatPanel } from '@/features/client-coach-messaging/components/ChatPanel';

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
  const { unreadTotal } = useChatUnread();
  const [dailyQuote, setDailyQuote] = useState('');
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
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const coachMessage = user?.motivationalMessage ?? null;

  return (
    <div className="px-4 py-5 md:px-6 md:py-7">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-accent/20 via-card to-background px-5 py-6 md:px-7 md:py-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-accent/10 blur-2xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                {greeting.icon && (
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-background/70 text-accent">
                    {greeting.icon}
                  </div>
                )}
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {greeting.text}, {firstName}.
                </h1>
              </div>
              <p className="text-sm text-foreground/80">Your daily compliance overview is ready.</p>
            </div>
            <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
              <CalendarDays size={14} />
              {todayLabel}
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section className="space-y-6 xl:col-span-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Today</p>
                <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                  3 daily check-in items
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <DailyCheckInCard />
                <DailyCheckInInsightsCard />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Additional Tracking
                </p>
                <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                  Optional
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DailyNutritionCard />
                <DailyTrainingCard />
              </div>
            </div>

            <div className="space-y-3">
              <p className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Weekly Check-In
              </p>
              <WeeklyCheckInCard />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Coach Chat</p>
                <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                  {unreadTotal} unread
                </span>
              </div>

              <div className="h-[560px] min-h-[480px] rounded-3xl border border-border/70 bg-card/70 overflow-hidden">
                <ChatPanel title="Coach Chat" hideConversationList />
              </div>
            </div>
          </section>

          <aside className="space-y-4 xl:col-span-4">
            <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-accent/15 via-background to-background p-5">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-sm font-semibold text-accent">Coach Inbox</p>
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
                      {unreadTotal} unread
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {coachMessage || 'No new coach messages right now.'}
                  </p>
                  <Link href="/user/chat" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
                    Open Chat
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/80 p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-accent mb-1">Daily Motivation</p>
                  <p className="text-sm text-foreground leading-relaxed">&quot;{dailyQuote}&quot;</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-gradient-to-r from-accent/10 via-transparent to-accent/10 px-4 py-3">
              <p className="text-xs text-foreground/70">
                <span className="font-semibold text-foreground">Consistency over intensity.</span> Keep logging daily,
                one day at a time.
              </p>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
