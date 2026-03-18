'use client';

import { useState } from 'react';
import { CalendarCheck2, ClipboardCheck, Sparkles } from 'lucide-react';
import { WeeklyCheckInCard } from '@/features/weekly-checkin/components/WeeklyCheckInCard';
import { DailyCheckInCard } from '@/features/daily-checkin/components/DailyCheckInCard';
import { DailyCheckInInsightsCard } from '@/features/daily-checkin/components/DailyCheckInInsightsCard';

type CheckInTab = 'daily' | 'weekly';

export default function UserCheckInsPage() {
  const [activeTab, setActiveTab] = useState<CheckInTab>('daily');

  return (
    <div className="px-4 pb-8 pt-4 md:px-5">
      <div className="mx-auto w-full max-w-xl space-y-6">
        <section className="relative overflow-hidden rounded-[30px] border border-border/70 bg-card/95 p-5 shadow-sm">
          <div className="pointer-events-none absolute -left-16 -top-14 h-44 w-44 rounded-full bg-accent/10 blur-3xl" />
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
          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tracking</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Check-In Center</h2>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/60 p-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('daily')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  activeTab === 'daily'
                    ? 'bg-accent/20 text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
                }`}
                aria-pressed={activeTab === 'daily'}
              >
                <ClipboardCheck size={16} />
                <span>Daily</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('weekly')}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  activeTab === 'weekly'
                    ? 'bg-accent/20 text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
                }`}
                aria-pressed={activeTab === 'weekly'}
              >
                <CalendarCheck2 size={16} />
                <span>Weekly</span>
              </button>
            </div>
          </div>

          {activeTab === 'daily' ? (
            <div className="space-y-4">
              <div className="px-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Today</p>
                <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground">Daily Check-In</h3>
              </div>

              <DailyCheckInCard />

              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Sparkles size={13} className="text-muted-foreground" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Progress</p>
                </div>
                <DailyCheckInInsightsCard />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="px-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">This week</p>
                <h3 className="mt-1 text-base font-semibold tracking-tight text-foreground">Weekly Check-In</h3>
              </div>
              <WeeklyCheckInCard />
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
