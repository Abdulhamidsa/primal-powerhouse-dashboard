'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Dumbbell, TrendingUp, CheckCircle2, Clock, ChevronRight } from 'lucide-react';

interface UserData {
  name: string;
  motivationalMessage?: string;
  currentWeight?: number;
  goalWeight?: number;
  stats?: {
    thisWeekVideos: number;
  };
  recentWorkouts?: Array<{
    id: string;
    date: string;
    type: string;
    duration: number;
    rating?: number;
  }>;
  upcomingAssignments?: Array<{
    id: string;
    title: string;
    dueDate?: string;
    completed: boolean;
  }>;
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      {title ? (
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">{children}</div>
    </section>
  );
}

function Row({
  icon,
  title,
  subtitle,
  right,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  const clickable = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`w-full text-left ${clickable ? 'hover:bg-muted/40 active:bg-muted/60' : ''}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted/50">{icon}</div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{title}</p>
          {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>

        {right ? <div className="shrink-0">{right}</div> : null}

        {clickable ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : null}
      </div>

      <div className="ml-16 h-px bg-border/60" />
    </button>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default function UserDashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const previousMessageRef = useRef<string | null>(null);

  const firstName = useMemo(() => {
    const name = userData?.name?.trim();
    return name ? name.split(' ')[0] : 'Member';
  }, [userData?.name]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/data');
      if (!response.ok) return;

      const data = await response.json();
      console.log('[DASHBOARD] Received user data:', data);

      if (
        previousMessageRef.current !== null &&
        previousMessageRef.current !== data.motivationalMessage &&
        data.motivationalMessage
      ) {
        showNotification(data.motivationalMessage);
      }

      previousMessageRef.current = data.motivationalMessage || null;
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Message from Your Coach', {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'motivational-message',
        requireInteraction: false,
      });
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => fetchUserData(), 30000);
    return () => clearInterval(interval);
  }, []);

  const weightSummary = useMemo(() => {
    const cur = userData?.currentWeight;
    const goal = userData?.goalWeight;
    if (typeof cur !== 'number' || typeof goal !== 'number') return null;

    const start = cur;
    const remaining = Math.abs(cur - goal);

    // Gentle progress estimate: if goal is lower, progress increases as current decreases.
    // This avoids weird math spikes and stays visually stable.
    const denom = Math.max(remaining + 10, 10);
    const progress = Math.round(Math.max(0, Math.min(100, (10 / denom) * 100)));

    return {
      cur,
      goal,
      remaining,
      progress,
      start,
    };
  }, [userData?.currentWeight, userData?.goalWeight]);

  if (loading && !userData) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Hi, {firstName}</h1>
          <p className="text-sm text-muted-foreground">Today is a good day to show up.</p>
        </div>
      </div>

      {/* Message (iOS note style) */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <Dumbbell className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">Coach note</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {userData?.motivationalMessage
                ? userData.motivationalMessage
                : 'The only bad workout is the one that did not happen.'}
            </p>
          </div>
        </div>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {weightSummary ? <StatPill label="Weight goal" value={`${weightSummary.cur} → ${weightSummary.goal}`} /> : null}

        {typeof userData?.stats?.thisWeekVideos === 'number' ? (
          <StatPill label="Assignments this week" value={`${userData.stats.thisWeekVideos}`} />
        ) : null}
      </div>

      {/* Progress group */}
      {weightSummary ? (
        <Section title="Progress">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Goal pace</p>
              <p className="text-xs text-muted-foreground">Remaining: {weightSummary.remaining} lbs</p>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${weightSummary.progress}%` }} />
            </div>

            <p className="mt-2 text-xs text-muted-foreground">Keep it consistent. Small wins stack.</p>
          </div>
        </Section>
      ) : null}

      {/* Upcoming */}
      {userData?.upcomingAssignments?.length ? (
        <Section title="Upcoming">
          {userData.upcomingAssignments.map(a => (
            <Row
              key={a.id}
              icon={<Clock className="h-4 w-4" />}
              title={a.title}
              subtitle={a.dueDate ? `Due ${new Date(a.dueDate).toLocaleDateString()}` : 'No due date'}
              right={
                a.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <span className="text-xs text-muted-foreground">Pending</span>
                )
              }
            />
          ))}
          <div className="ml-16 h-px bg-transparent" />
        </Section>
      ) : null}

      {/* Recent workouts */}
      {userData?.recentWorkouts?.length ? (
        <Section title="Recent workouts">
          {userData.recentWorkouts.map(w => (
            <Row
              key={w.id}
              icon={<TrendingUp className="h-4 w-4" />}
              title={w.type.replace(/_/g, ' ')}
              subtitle={`${w.duration} min • ${new Date(w.date).toLocaleDateString()}`}
              right={
                typeof w.rating === 'number' ? (
                  <span className="text-xs font-semibold text-primary">{w.rating}★</span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )
              }
            />
          ))}
          <div className="ml-16 h-px bg-transparent" />
        </Section>
      ) : null}
    </div>
  );
}
