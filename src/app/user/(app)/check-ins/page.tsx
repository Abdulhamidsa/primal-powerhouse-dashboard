'use client';

import { useState } from 'react';
import { CalendarCheck2, ClipboardCheck, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { WeeklyCheckInCard } from '@/features/weekly-checkin/components/WeeklyCheckInCard';
import { DailyCheckInCard } from '@/features/daily-checkin/components/DailyCheckInCard';
import { DailyCheckInInsightsCard } from '@/features/daily-checkin/components/DailyCheckInInsightsCard';

type CheckInTab = 'daily' | 'weekly';

export default function UserCheckInsPage() {
  const [activeTab, setActiveTab] = useState<CheckInTab>('daily');

  return (
    <div className="px-4 pb-8 md:px-5">
      <div className="mx-auto w-full max-w-xl space-y-6">
        <PageHeader
          title="Check-Ins"
          label="Tracking"
          description="Track your daily and weekly progress in one place."
        />

        <section className="space-y-3">
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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Progress
                  </p>
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
