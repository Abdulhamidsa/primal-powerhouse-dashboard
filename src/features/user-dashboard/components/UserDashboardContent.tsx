'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRightIcon as ArrowRight, CheckCircleIcon as CheckCircle2, ClipboardTextIcon as ClipboardCheck, BarbellIcon as Dumbbell, FlameIcon as Flame, ChatCircleIcon as MessageCircle, MoonIcon as Moon, BowlFoodIcon as Salad, SunIcon as Sun } from '@phosphor-icons/react';
import { UserPageHero } from '@/components/UserPageHero';
import { useTodayMission } from '@/features/today-mission/hooks/useTodayMission';
import type { UserDashboardSummary } from '@/features/user-dashboard/types/userDashboard.types';

function TodayBadge({ streakCount }: { streakCount: number }) {
  if (streakCount <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold text-foreground" style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}>
      <Flame aria-hidden="true" focusable="false" size={12} className="text-primary" />
      {streakCount} day streak
    </span>
  );
}

function DashboardStatusCard({
  title,
  description,
  href,
  icon,
  state,
  action,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  state: 'done' | 'pending' | 'progress';
  action: string;
}) {
  const isDone = state === 'done';

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[26px] border p-4 shadow-sm transition-transform active:scale-[0.99]"
      style={{
        background: 'var(--color-surface)',
        borderColor: isDone ? 'color-mix(in srgb, var(--color-accent) 34%, var(--color-border))' : 'var(--color-border)',
      }}
    >
      <div aria-hidden="true" className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent" />
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
          style={{
            background: isDone ? 'var(--color-accent-translucent)' : 'var(--color-bg-alt)',
            color: isDone ? 'var(--color-accent)' : 'var(--color-text-muted)',
          }}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold tracking-tight text-[var(--color-text)]">{title}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{
                background: isDone ? 'var(--color-accent-translucent)' : 'var(--color-bg-alt)',
                color: isDone ? 'var(--color-accent)' : 'var(--color-text-muted)',
              }}
            >
              {isDone ? 'Done' : state === 'progress' ? 'Active' : 'Due'}
            </span>
          </span>
          <span className="mt-1 block text-xs leading-5 text-[var(--color-text-muted)]">{description}</span>
          <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)]">
            {action}
            <ArrowRight aria-hidden="true" focusable="false" size={13} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </span>
      </div>
    </Link>
  );
}

export function UserDashboardContent({ summary }: { summary: UserDashboardSummary }) {
  const greeting = useMemo(() => {
    const denmarkTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' });
    const hour = new Date(denmarkTime).getHours();

    if (hour >= 5 && hour < 12) return { text: 'Good morning', icon: <Sun aria-hidden="true" focusable="false" size={17} /> };
    if (hour >= 12 && hour < 18) return { text: 'Good afternoon', icon: <Sun aria-hidden="true" focusable="false" size={17} /> };
    return { text: 'Good evening', icon: <Moon aria-hidden="true" focusable="false" size={17} /> };
  }, []);

  const { summary: todayMission } = useTodayMission(summary);
  const firstName = summary.user.name.split(' ')[0] || 'Member';
  const coachMessage = summary.user.motivationalMessage;
  const isCheckInComplete = summary.dailyCheckIn.isComplete;
  const isMealsComplete = todayMission.mealProgress.total > 0 && todayMission.mealProgress.percentage === 100;
  const hasMeals = todayMission.mealProgress.total > 0;
  const isWorkoutDone = summary.dailyCheckIn.trainingStatus === 'DONE';
  const isWorkoutInProgress = Boolean(summary.training.activeSessionId);
  const showCoachNote = Boolean(coachMessage || summary.unreadTotal > 0);

  return (
    <div className="space-y-3 md:space-y-4">
      <UserPageHero
        eyebrow="Today"
        title={`${greeting.text}, ${firstName}`}
        description="One clear step at a time."
        icon={greeting.icon}
        statusItems={[
          { label: 'Meals', value: `${todayMission.mealProgress.percentage}%`, tone: isMealsComplete ? 'good' : 'neutral' },
          { label: 'Check-in', value: isCheckInComplete ? 'Complete' : 'Due', tone: isCheckInComplete ? 'good' : 'warn' },
          { label: 'Coach', value: summary.unreadTotal > 0 ? `${summary.unreadTotal} unread` : 'All clear', tone: summary.unreadTotal > 0 ? 'warn' : 'good' },
        ]}
      >
        <div className="flex items-center justify-between gap-3">
          <TodayBadge streakCount={summary.streakCount} />
        </div>
      </UserPageHero>

      <section className="grid gap-3 sm:grid-cols-3">
        <DashboardStatusCard
          title="Check-ins"
          description={isCheckInComplete ? 'Daily check-in is complete.' : 'Energy, hunger, sleep, meals, and training are due.'}
          href="/user/check-ins"
          icon={<ClipboardCheck aria-hidden="true" focusable="false" size={18} />}
          state={isCheckInComplete ? 'done' : 'pending'}
          action={isCheckInComplete ? 'Review' : 'Finish'}
        />
        <DashboardStatusCard
          title="Workout"
          description={
            isWorkoutDone
              ? 'Today’s training is marked done.'
              : isWorkoutInProgress
                ? 'Workout is in progress.'
                : summary.training.activePlanName
                  ? `${summary.training.activePlanName} is ready.`
                  : 'Open your training plan.'
          }
          href="/user/training"
          icon={<Dumbbell aria-hidden="true" focusable="false" size={18} />}
          state={isWorkoutDone ? 'done' : isWorkoutInProgress ? 'progress' : 'pending'}
          action={isWorkoutInProgress ? 'Continue' : isWorkoutDone ? 'Review' : 'Open'}
        />
        <DashboardStatusCard
          title="Meals"
          description={
            isMealsComplete
              ? `${todayMission.mealProgress.completed}/${todayMission.mealProgress.total} meals done.`
              : hasMeals
                ? `${todayMission.mealProgress.completed}/${todayMission.mealProgress.total} meals done.`
                : 'Choose your meals for today.'
          }
          href="/user/my-plan"
          icon={<Salad aria-hidden="true" focusable="false" size={18} />}
          state={isMealsComplete ? 'done' : hasMeals && todayMission.mealProgress.completed > 0 ? 'progress' : 'pending'}
          action={isMealsComplete ? 'Review' : hasMeals ? 'Continue' : 'Choose'}
        />
      </section>

      {showCoachNote ? <section className="rounded-[26px] border px-4 py-3.5 shadow-sm" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--color-accent-translucent)', color: 'var(--color-accent)' }}>
            {summary.unreadTotal > 0 ? <MessageCircle aria-hidden="true" focusable="false" size={15} /> : <CheckCircle2 aria-hidden="true" focusable="false" size={15} />}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Coach note</p>
            <p className="mt-1 text-sm leading-5 text-foreground">
              {coachMessage ?? 'Your coach sent a new message.'}
            </p>
          </div>
          {summary.unreadTotal > 0 ? <Link href="/user/chat" className="ml-auto shrink-0 pt-1 text-xs font-semibold text-primary">Chat</Link> : null}
        </div>
      </section> : null}
    </div>
  );
}
