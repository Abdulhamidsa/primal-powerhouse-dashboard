'use client';

import { ClipboardCheck, Sparkles } from 'lucide-react';
import { WeeklyCheckInCard } from '@/features/weekly-checkin/components/WeeklyCheckInCard';
import { DailyCheckInCard } from '@/features/daily-checkin/components/DailyCheckInCard';
import { DailyCheckInInsightsCard } from '@/features/daily-checkin/components/DailyCheckInInsightsCard';

export default function UserCheckInsPage() {
  return (
    <div className="px-4 pb-8 pt-4 md:px-5">
      <div className="mx-auto w-full max-w-xl space-y-7">
        <section className="rounded-[30px] border border-border/70 bg-card/90 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <ClipboardCheck size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Check-Ins</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Stay consistent with weekly and daily tracking. Small updates now make progress easier later.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="px-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">This week</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Weekly Check-In</h2>
          </div>
          <WeeklyCheckInCard />
        </section>

        <section className="space-y-3">
          <div className="px-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Today</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Daily Check-In</h2>
          </div>
          <DailyCheckInCard />
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={13} className="text-muted-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Progress</p>
          </div>
          <DailyCheckInInsightsCard />
        </section>
      </div>
    </div>
  );
}
