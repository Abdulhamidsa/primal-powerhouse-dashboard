'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  ArrowRightIcon as ArrowRight,
  CheckCircleIcon as CheckCircle2,
  ClipboardTextIcon as ClipboardCheck,
  BarbellIcon as Dumbbell,
  CaretRightIcon as ChevronRight,
  ChatCircleIcon as MessageCircle,
  MoonIcon as Moon,
  BowlFoodIcon as Salad,
  SunIcon as Sun,
} from '@phosphor-icons/react';
import { UserPageHero } from '@/components/UserPageHero';
import { useTodayMission } from '@/features/today-mission/hooks/useTodayMission';
import { getDashboardPrimaryAction } from '@/features/user-dashboard/lib/dashboardPrimaryAction';
import type { UserDashboardSummary } from '@/features/user-dashboard/types/userDashboard.types';

function DashboardTaskRow({
  title,
  description,
  href,
  icon,
  stateLabel,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  stateLabel: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[68px] items-center gap-3 px-4 py-3.5 transition-colors active:bg-[var(--color-bg-alt)]"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-bg-alt)] text-[var(--color-accent)]"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold tracking-tight text-[var(--color-text)]">{title}</span>
        <span className="mt-0.5 block truncate text-xs leading-5 text-[var(--color-text-muted)]">{description}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-xs font-semibold text-[var(--color-accent)]">{stateLabel}</span>
        <ChevronRight
          aria-hidden="true"
          focusable="false"
          size={16}
          className="text-[var(--color-text-muted)] transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

export function UserDashboardContent({ summary }: { summary: UserDashboardSummary }) {
  const greeting = useMemo(() => {
    const denmarkTime = new Date().toLocaleString('en-US', { timeZone: 'Europe/Copenhagen' });
    const hour = new Date(denmarkTime).getHours();

    if (hour >= 5 && hour < 12)
      return { text: 'Good morning', icon: <Sun aria-hidden="true" focusable="false" size={17} /> };
    if (hour >= 12 && hour < 18)
      return { text: 'Good afternoon', icon: <Sun aria-hidden="true" focusable="false" size={17} /> };
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
  const isWorkoutReady = Boolean(summary.training.activePlanName || summary.training.activeAssignmentCount);
  const showCoachNote = Boolean(coachMessage || summary.unreadTotal > 0);
  const primaryAction = getDashboardPrimaryAction({
    summary,
    mealProgress: todayMission,
    checkInEnabled: summary.featureVisibility.dailyCheckinsEnabled,
    completeAction: { href: '/user/check-ins', label: 'Review today' },
    fallbackAction: isWorkoutReady
      ? { href: '/user/training', label: 'Open training plan' }
      : { href: '/user/my-plan', label: 'Choose your meals' },
  });
  const statusItems = [
    {
      label: 'Meals',
      value: hasMeals ? `${todayMission.mealProgress.completed}/${todayMission.mealProgress.total}` : 'Choose today',
      tone: isMealsComplete ? ('good' as const) : ('neutral' as const),
    },
    {
      label: 'Check-in',
      value: isCheckInComplete ? 'Complete' : 'Due',
      tone: isCheckInComplete ? ('good' as const) : ('warn' as const),
    },
    {
      label: 'Coach',
      value: summary.unreadTotal > 0 ? `${summary.unreadTotal} unread` : 'Clear',
      tone: summary.unreadTotal > 0 ? ('warn' as const) : ('good' as const),
    },
    ...(summary.streakCount > 0
      ? [{
          label: 'Streak',
          value: `${summary.streakCount} day${summary.streakCount === 1 ? '' : 's'}`,
          tone: 'neutral' as const,
        }]
      : []),
  ];

  return (
    <div className="space-y-3 md:space-y-4">
      <UserPageHero
        eyebrow="Today"
        title={`${greeting.text}, ${firstName}`}
        description="One clear step at a time."
        icon={greeting.icon}
        statusItems={statusItems}
        statusVariant="summary"
      />

      <Link
        href={primaryAction.href}
        className="group flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-text-on-accent)] shadow-sm transition-transform active:scale-[0.99]"
      >
        <span>{primaryAction.label}</span>
        <ArrowRight
          aria-hidden="true"
          focusable="false"
          size={17}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </Link>

      <section
        className="overflow-hidden rounded-[26px] border shadow-sm"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        aria-label="Today tasks"
      >
        <DashboardTaskRow
          title="Check-ins"
          description={
            isCheckInComplete ? 'Daily check-in is complete.' : 'Energy, hunger, sleep, meals, and training are due.'
          }
          href="/user/check-ins"
          icon={<ClipboardCheck aria-hidden="true" focusable="false" size={18} />}
          stateLabel={isCheckInComplete ? 'Complete' : 'Due'}
        />
        <div className="ml-16 h-px bg-[var(--color-border)]/60" />
        <DashboardTaskRow
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
          stateLabel={isWorkoutDone ? 'Complete' : isWorkoutInProgress ? 'In progress' : isWorkoutReady ? 'Ready' : 'Open'}
        />
        <div className="ml-16 h-px bg-[var(--color-border)]/60" />
        <DashboardTaskRow
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
          stateLabel={
            isMealsComplete
              ? 'Complete'
              : hasMeals
                ? `${todayMission.mealProgress.completed}/${todayMission.mealProgress.total}`
                : 'Choose'
          }
        />
      </section>

      {showCoachNote ? (
        <section
          className={`rounded-2xl border px-3.5 py-3 ${summary.unreadTotal > 0 ? 'border-[var(--color-accent)]/45' : ''}`}
          style={{
            background: summary.unreadTotal > 0 ? 'var(--color-accent-translucent)' : 'var(--color-surface)',
            borderColor: summary.unreadTotal > 0 ? undefined : 'var(--color-border)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'var(--color-accent-translucent)', color: 'var(--color-accent)' }}
            >
              {summary.unreadTotal > 0 ? (
                <MessageCircle aria-hidden="true" focusable="false" size={15} />
              ) : (
                <CheckCircle2 aria-hidden="true" focusable="false" size={15} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Coach note</p>
              <p className="mt-1 text-sm leading-5 text-foreground">
                {coachMessage ?? 'Your coach sent a new message.'}
              </p>
            </div>
            {summary.unreadTotal > 0 ? (
              <Link href="/user/chat" className="ml-auto shrink-0 pt-1 text-xs font-semibold text-primary">
                Chat
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
