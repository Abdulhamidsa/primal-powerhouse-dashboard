'use client';

import Link from 'next/link';
import { ArrowRightIcon as ArrowRight, BookOpenTextIcon as BookOpenText, CalendarCheckIcon as CalendarCheck2, CheckIcon as Check, BarbellIcon as Dumbbell, FlameIcon as Flame, ForkKnifeIcon as Utensils } from '@phosphor-icons/react';
import { useTodayMission } from '@/features/today-mission/hooks/useTodayMission';
import type { UserDashboardSummary } from '@/features/user-dashboard/types/userDashboard.types';
import { UserPageHero } from '@/components/UserPageHero';

export function SelfServiceDashboardContent({ summary }: { summary: UserDashboardSummary }) {
  const firstName = summary.user.name.split(' ')[0] || 'Member';
  const { summary: today } = useTodayMission(summary);
  const mealsSelected = today.mealProgress.total;
  const mealsCompleted = today.mealProgress.completed;
  const mealsDone = mealsSelected > 0 && today.mealProgress.percentage === 100;
  const trainingReady = Boolean(summary.training.activePlanName || summary.training.activeAssignmentCount);
  const trainingDone = summary.dailyCheckIn.trainingStatus === 'DONE';
  const dailyTotal = (mealsSelected > 0 ? 1 : 0) + (trainingReady ? 1 : 0);
  const dailyCompleted = (mealsDone ? 1 : 0) + (trainingDone ? 1 : 0);
  const continueAction = summary.training.activeSessionId && summary.training.activeAssignmentId
    ? { href: `/user/workout/${encodeURIComponent(summary.training.activeAssignmentId)}`, label: 'Resume workout' }
    : mealsSelected > 0 && !mealsDone
      ? { href: '/user/my-plan', label: 'Continue meal plan' }
      : trainingReady
        ? { href: '/user/training', label: 'Open training plan' }
        : { href: '/user/my-plan', label: 'Open your program' };

  return (
    <div className="space-y-3">
      <UserPageHero
        eyebrow="Starter program"
        title={`Welcome back, ${firstName}`}
        description="Your training, nutrition, and next step in one place."
        icon={<Flame size={17} />}
        statusItems={[
          { label: 'Meals', value: mealsSelected ? `${mealsCompleted}/${mealsSelected} complete` : 'Choose today', tone: mealsDone ? 'good' : 'neutral' },
          { label: 'Training', value: trainingDone ? 'Complete' : trainingReady ? 'Ready' : 'Waiting', tone: trainingDone ? 'good' : trainingReady ? 'neutral' : 'warn' },
        ]}
      >
        <Link href={continueAction.href} className="flex min-h-12 items-center justify-between rounded-2xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-text-on-accent)] transition-transform active:scale-[0.99]">
          <span>{continueAction.label}</span><ArrowRight size={17} />
        </Link>
      </UserPageHero>

      <section className="grid grid-cols-2 gap-3" aria-label="Your program">
        <ProgramCard
          href="/user/my-plan"
          icon={<Utensils size={18} />}
          eyebrow="Nutrition"
          title="Meal plan"
          detail={mealsSelected ? `${mealsCompleted} of ${mealsSelected} meals complete` : 'Choose today’s meals'}
          progress={today.mealProgress.percentage}
        />
        <ProgramCard
          href="/user/training"
          icon={<Dumbbell size={18} />}
          eyebrow="Training"
          title={summary.training.activePlanName || 'Training plan'}
          detail={summary.training.activeSessionId ? 'Session in progress' : trainingReady ? 'Your plan is ready' : 'Open your program'}
          active={trainingReady}
        />
      </section>

      <section className="rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Today</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{dailyTotal > 0 ? `${dailyCompleted} of ${dailyTotal} steps complete` : 'Your program is ready'}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{dailyTotal > 0 && dailyCompleted === dailyTotal ? 'Everything planned for today is complete.' : 'Keep your nutrition and training moving together.'}</p>
          </div>
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-bold text-[var(--color-accent)]">
            {dailyTotal > 0 ? `${dailyCompleted}/${dailyTotal}` : '—'}
          </div>
        </div>
        {summary.streakCount > 0 ? <p className="mt-3 flex items-center gap-2 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-muted)]"><Check size={14} className="text-[var(--color-accent)]" /> {summary.streakCount} day consistency streak</p> : null}
      </section>

      <Link href="/user/learn" className="group flex min-h-[88px] items-center gap-4 rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 transition-colors hover:border-[var(--color-accent)]/40">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]"><BookOpenText size={19} /></span>
        <span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">Method</span><span className="mt-1 block text-sm font-semibold text-[var(--color-text)]">Build the knowledge behind your program</span></span>
        <ArrowRight size={17} className="text-[var(--color-text-muted)] transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

function ProgramCard({ href, icon, eyebrow, title, detail, progress, active }: { href: string; icon: React.ReactNode; eyebrow: string; title: string; detail: string; progress?: number; active?: boolean }) {
  return (
    <Link href={href} className="flex min-h-40 flex-col rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-transform active:scale-[0.99]">
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[var(--color-bg-alt)] text-[var(--color-accent)]">{icon}</span>
      <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{eyebrow}</p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[var(--color-text)]">{title}</p>
      <p className="mt-auto pt-3 text-[11px] leading-4 text-[var(--color-text-muted)]">{detail}</p>
      {typeof progress === 'number' ? <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--color-bg-alt)]"><div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${progress}%` }} /></div> : active ? <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]"><CalendarCheck2 size={12} /> Active</div> : null}
    </Link>
  );
}
