'use client';

import { useRouter } from 'next/navigation';
import { Activity, CalendarCheck2, CheckCircle2, PencilLine } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWeeklyCheckInCurrentWeek } from '@/features/weekly-checkin/hooks/useWeeklyCheckIn';
import { formatDateLabel } from '@/features/weekly-checkin/utils/week';

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      {label}
    </span>
  );
}

export function WeeklyCheckInCard() {
  const router = useRouter();
  const { checkIn, status, isLoading } = useWeeklyCheckInCurrentWeek();

  if (isLoading) {
    return <div className="h-40 w-full animate-pulse rounded-3xl border border-border/70 bg-card/80" />;
  }

  const dueLabel = status === 'overdue' ? 'Overdue' : status === 'due' ? 'Due' : 'Completed';

  if (!checkIn) {
    return (
      <Card className="rounded-3xl border-border/70 bg-card/90">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              <CardTitle className="text-lg">Weekly Check-In Due</CardTitle>
            </div>
            <StatusBadge label={dueLabel} />
          </div>
          <CardDescription>Track your progress for this week.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button className="w-full sm:w-auto" onClick={() => router.push('/user/check-in')}>
            Start Check-In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-border/70 bg-card/90">
      <CardHeader className="space-y-3 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">This Week&apos;s Check-In</CardTitle>
          </div>
          <StatusBadge label={dueLabel} />
        </div>
        <CardDescription>Submitted {formatDateLabel(checkIn.submittedAt)}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between rounded-2xl bg-muted/30 p-3">
          <div className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <p className="text-sm font-medium text-foreground">Weekly check-in completed</p>
          </div>
          <Button
            aria-label="Edit this week's check-in"
            className="h-9 w-9 rounded-full"
            size="icon"
            variant="ghost"
            onClick={() => router.push('/user/check-in')}
          >
            <PencilLine className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
