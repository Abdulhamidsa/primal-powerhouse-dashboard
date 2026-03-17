'use client';

import Link from 'next/link';
import { MessageSquare, Activity, Clock3, ArrowRight, CheckCircle2, ShieldAlert, Gauge, Sparkles } from 'lucide-react';
import type {
  AdminCommandCenterResponse,
  CommandCenterAction,
  CommandCenterAttentionItem,
  CommandCenterIssue,
  CommandCenterRecentChange,
  CommandCenterSeverity,
} from '@/features/admin-command-center/types/adminCommandCenter.types';

interface AdminCommandCenterViewProps {
  data: AdminCommandCenterResponse;
  busyItemId: string | null;
  actionError: string | null;
  onQuickMessage: (clientId: string, message: string) => Promise<void>;
  onMarkReviewed: (clientId: string, checkInId: string) => Promise<void>;
  quickReplyTemplate: Record<CommandCenterSeverity, string>;
}

function severityLabel(severity: CommandCenterSeverity): string {
  if (severity === 'critical') return 'Needs Attention';
  if (severity === 'warning') return 'At Risk';
  return 'Watch';
}

function severityTone(severity: CommandCenterSeverity): {
  border: string;
  background: string;
  badgeBg: string;
  badgeText: string;
  accent: string;
} {
  if (severity === 'critical') {
    return {
      border: 'rgba(239, 68, 68, 0.45)',
      background: 'rgba(239, 68, 68, 0.10)',
      badgeBg: 'rgba(239, 68, 68, 0.18)',
      badgeText: '#fca5a5',
      accent: '#f87171',
    };
  }

  if (severity === 'warning') {
    return {
      border: 'rgba(245, 158, 11, 0.42)',
      background: 'rgba(245, 158, 11, 0.10)',
      badgeBg: 'rgba(245, 158, 11, 0.18)',
      badgeText: '#fcd34d',
      accent: '#f59e0b',
    };
  }

  return {
    border: 'rgba(148, 163, 184, 0.35)',
    background: 'rgba(148, 163, 184, 0.10)',
    badgeBg: 'rgba(148, 163, 184, 0.18)',
    badgeText: '#cbd5e1',
    accent: '#94a3b8',
  };
}

function relativeTimeLabel(value: string): string {
  const target = new Date(value).getTime();
  const diffMs = Date.now() - target;
  const diffMin = Math.max(1, Math.round(diffMs / 60000));

  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function actionByKind(actions: CommandCenterAction[], kind: CommandCenterAction['kind']): CommandCenterAction | null {
  return actions.find(action => action.kind === kind) ?? null;
}

function IssueChip({ issue }: { issue: CommandCenterIssue }) {
  const tone = severityTone(issue.severity);

  return (
    <div
      className="rounded-md border px-2.5 py-1.5 text-xs transition-colors duration-200"
      style={{
        borderColor: tone.border,
        background: tone.background,
        color: 'var(--color-text)',
      }}
    >
      <span className="font-medium">{issue.title}</span>
    </div>
  );
}

function AttentionRow({
  item,
  busyItemId,
  quickReplyTemplate,
  onQuickMessage,
  onMarkReviewed,
}: {
  item: CommandCenterAttentionItem;
  busyItemId: string | null;
  quickReplyTemplate: Record<CommandCenterSeverity, string>;
  onQuickMessage: (clientId: string, message: string) => Promise<void>;
  onMarkReviewed: (clientId: string, checkInId: string) => Promise<void>;
}) {
  const quickMessageAction = actionByKind(item.actions, 'quick_message');
  const reviewedAction = actionByKind(item.actions, 'mark_checkin_reviewed');
  const assignMealAction = actionByKind(item.actions, 'assign_meal');
  const assignWorkoutAction = actionByKind(item.actions, 'assign_workout');
  const openClientAction = actionByKind(item.actions, 'open_client');
  const tone = severityTone(item.severity);

  const secondaryButtonClass =
    'inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-all duration-200 hover:translate-y-[-1px]';
  const primaryButtonClass =
    'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-all duration-200 hover:translate-y-[-1px]';

  return (
    <div
      className="rounded-xl border p-4 space-y-3 transition-all duration-200 hover:shadow-lg"
      style={{
        borderColor: tone.border,
        background: `linear-gradient(180deg, rgba(20,20,20,0.98) 0%, ${tone.background} 100%)`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p
            className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
            style={{
              background: tone.badgeBg,
              color: tone.badgeText,
            }}
          >
            {severityLabel(item.severity)}
          </p>
          <h3 className="text-base font-semibold leading-tight" style={{ color: 'var(--color-text)' }}>
            {item.clientName}
          </h3>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            {item.title}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {item.detail}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {relativeTimeLabel(item.occurredAt)}
          </p>
          <p className="text-[11px] mt-1" style={{ color: tone.badgeText }}>
            {item.issueCount} issue{item.issueCount === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.issues.slice(0, 4).map(issue => (
          <IssueChip key={issue.id} issue={issue} />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {quickMessageAction ? (
          <button
            type="button"
            onClick={() =>
              onQuickMessage(item.clientId, quickMessageAction.messageTemplate || quickReplyTemplate[item.severity])
            }
            disabled={busyItemId === item.clientId}
            className={primaryButtonClass}
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-text-on-accent)',
            }}
          >
            <MessageSquare size={14} /> Quick Message
          </button>
        ) : null}

        {reviewedAction?.checkInId ? (
          <button
            type="button"
            onClick={() => onMarkReviewed(item.clientId, reviewedAction.checkInId as string)}
            disabled={busyItemId === reviewedAction.checkInId}
            className={secondaryButtonClass}
            style={{
              borderColor: 'var(--color-border)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--color-text)',
            }}
          >
            <CheckCircle2 size={14} /> Mark Reviewed
          </button>
        ) : null}

        {assignMealAction?.href ? (
          <Link
            href={assignMealAction.href}
            className={secondaryButtonClass}
            style={{
              borderColor: 'var(--color-border)',
              background: 'rgba(255,255,255,0.02)',
              color: 'var(--color-text)',
            }}
          >
            Assign Meal
          </Link>
        ) : null}

        {assignWorkoutAction?.href ? (
          <Link
            href={assignWorkoutAction.href}
            className={secondaryButtonClass}
            style={{
              borderColor: 'var(--color-border)',
              background: 'rgba(255,255,255,0.02)',
              color: 'var(--color-text)',
            }}
          >
            Assign Workout
          </Link>
        ) : null}

        {openClientAction?.href ? (
          <Link
            href={openClientAction.href}
            className={secondaryButtonClass}
            style={{
              borderColor: tone.border,
              background: 'transparent',
              color: tone.badgeText,
            }}
          >
            Open Client <ArrowRight size={14} />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function RecentChangeRow({ change }: { change: CommandCenterRecentChange }) {
  const openClientAction = actionByKind(change.actions, 'open_client');

  return (
    <div className="border rounded-lg p-3" style={{ borderColor: 'var(--color-border)' }}>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        {change.clientName}
      </p>
      <p className="text-sm" style={{ color: 'var(--color-text)' }}>
        {change.text}
      </p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {relativeTimeLabel(change.occurredAt)}
        </span>
        {openClientAction?.href ? (
          <Link href={openClientAction.href} className="text-xs" style={{ color: 'var(--color-accent)' }}>
            Open
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function AdminCommandCenterView({
  data,
  busyItemId,
  actionError,
  onQuickMessage,
  onMarkReviewed,
  quickReplyTemplate,
}: AdminCommandCenterViewProps) {
  const critical = data.attention.find(group => group.severity === 'critical');
  const warning = data.attention.find(group => group.severity === 'warning');
  const watch = data.attention.find(group => group.severity === 'watch');
  const attentionCount = (critical?.items.length ?? 0) + (warning?.items.length ?? 0) + (watch?.items.length ?? 0);

  return (
    <div className="space-y-10">
      <header className="space-y-2 pb-1">
        <h1 className="text-3xl font-bold text-foreground">Coach Command Center</h1>
        <p className="text-muted-foreground max-w-3xl">
          Prioritize attention, clear risks, and execute today&apos;s actions before context-switching.
        </p>
      </header>

      {actionError ? (
        <div
          className="rounded-xl border p-3 text-sm"
          style={{
            borderColor: 'rgba(239,68,68,0.45)',
            background: 'rgba(239,68,68,0.1)',
            color: '#fca5a5',
          }}
        >
          {actionError}
        </div>
      ) : null}

      <section className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        <div className="space-y-6">
          <div
            className="rounded-2xl border p-5 space-y-5"
            style={{
              borderColor: attentionCount ? 'rgba(239,68,68,0.42)' : 'var(--color-border)',
              background:
                attentionCount > 0
                  ? 'linear-gradient(180deg, rgba(17,17,17,0.98) 0%, rgba(239,68,68,0.06) 100%)'
                  : 'linear-gradient(180deg, rgba(17,17,17,0.98) 0%, rgba(148,163,184,0.05) 100%)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Attention Queue</h2>
              </div>
              <span
                className="text-xs rounded-full px-2.5 py-1 font-semibold"
                style={{
                  background: attentionCount > 0 ? 'rgba(239,68,68,0.18)' : 'rgba(148,163,184,0.16)',
                  color: attentionCount > 0 ? '#fca5a5' : '#cbd5e1',
                }}
              >
                {attentionCount} active
              </span>
            </div>

            {critical?.items.length ? (
              <div className="space-y-3 pt-1">
                <p className="text-xs uppercase tracking-wide" style={{ color: '#fca5a5' }}>
                  Needs Attention
                </p>
                {critical.items.map(item => (
                  <AttentionRow
                    key={item.id}
                    item={item}
                    busyItemId={busyItemId}
                    onQuickMessage={onQuickMessage}
                    onMarkReviewed={onMarkReviewed}
                    quickReplyTemplate={quickReplyTemplate}
                  />
                ))}
              </div>
            ) : null}

            {warning?.items.length ? (
              <div className="space-y-3 pt-1">
                <p className="text-xs uppercase tracking-wide" style={{ color: '#fcd34d' }}>
                  At Risk
                </p>
                {warning.items.map(item => (
                  <AttentionRow
                    key={item.id}
                    item={item}
                    busyItemId={busyItemId}
                    onQuickMessage={onQuickMessage}
                    onMarkReviewed={onMarkReviewed}
                    quickReplyTemplate={quickReplyTemplate}
                  />
                ))}
              </div>
            ) : null}

            {watch?.items.length ? (
              <div className="space-y-3 pt-1">
                <p className="text-xs uppercase tracking-wide" style={{ color: '#cbd5e1' }}>
                  Watch
                </p>
                {watch.items.map(item => (
                  <AttentionRow
                    key={item.id}
                    item={item}
                    busyItemId={busyItemId}
                    onQuickMessage={onQuickMessage}
                    onMarkReviewed={onMarkReviewed}
                    quickReplyTemplate={quickReplyTemplate}
                  />
                ))}
              </div>
            ) : null}

            {!critical?.items.length && !warning?.items.length && !watch?.items.length ? (
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'rgba(148,163,184,0.06)' }}>
                <p className="text-sm text-foreground font-medium">Queue is clear</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  No urgent clients right now. Use this window to proactively message clients in watch status.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ borderColor: 'var(--color-border)', background: 'rgba(20,20,20,0.95)' }}
          >
            <div className="flex items-center gap-2">
              <Clock3 size={16} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Today Actions</h2>
            </div>

            {data.todayActions.length ? (
              <div className="space-y-3">
                {data.todayActions.map(action => {
                  const quickMessageAction = actionByKind(action.actions, 'quick_message');
                  const openClientAction = actionByKind(action.actions, 'open_client');

                  return (
                    <div
                      key={action.id}
                      className="border rounded-xl p-3.5 transition-all duration-200 hover:translate-y-[-1px]"
                      style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.02)' }}
                    >
                      <p className="text-sm font-semibold text-foreground">{action.clientName}</p>
                      <p className="text-sm text-foreground mt-0.5">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.detail}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {quickMessageAction ? (
                          <button
                            type="button"
                            onClick={() => onQuickMessage(action.clientId, quickMessageAction.messageTemplate || 'Quick check-in from your coach.')}
                            disabled={busyItemId === action.clientId}
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 hover:translate-y-[-1px]"
                            style={{
                              background: 'var(--color-accent)',
                              color: 'var(--color-text-on-accent)',
                            }}
                          >
                            <MessageSquare size={13} /> Message
                          </button>
                        ) : null}
                        {openClientAction?.href ? (
                          <Link
                            href={openClientAction.href}
                            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all duration-200 hover:translate-y-[-1px]"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                          >
                            Open <ArrowRight size={12} />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'rgba(148,163,184,0.06)' }}>
                <p className="text-sm font-medium text-foreground">No pending actions</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  Action queue is clear. Review watch clients to stay ahead before risk increases.
                </p>
              </div>
            )}
          </div>

          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ borderColor: 'var(--color-border)', background: 'rgba(20,20,20,0.95)' }}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Momentum</h2>
            </div>
            {data.momentum.length ? (
              <div className="space-y-3">
                {data.momentum.map(item => (
                  <div
                    key={item.id}
                    className="border rounded-xl p-3.5 transition-all duration-200 hover:translate-y-[-1px]"
                    style={{
                      borderColor: 'rgba(34,197,94,0.35)',
                      background: 'rgba(34,197,94,0.10)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{item.clientName}</p>
                      <span className="text-[11px] rounded-full px-2 py-0.5" style={{ background: 'rgba(34,197,94,0.2)', color: '#86efac' }}>
                        On Track
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'rgba(148,163,184,0.06)' }}>
                <p className="text-sm font-medium text-foreground">Momentum will appear here</p>
                <p className="text-xs mt-1 text-muted-foreground">
                  As clients complete workouts and logs, positive progress signals will surface in this lane.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6">
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{ borderColor: 'var(--color-border)', background: 'rgba(20,20,20,0.95)' }}
        >
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Recent Changes</h2>
          </div>
          {data.recentChanges.length ? (
            <div className="space-y-3">
              {data.recentChanges.map(change => (
                <RecentChangeRow key={change.id} change={change} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'rgba(148,163,184,0.06)' }}>
              <p className="text-sm font-medium text-foreground">No recent updates</p>
              <p className="text-xs mt-1 text-muted-foreground">
                New messages, check-ins, workouts, and nutrition logs will appear here in real time.
              </p>
            </div>
          )}
        </div>

        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{ borderColor: 'var(--color-border)', background: 'rgba(20,20,20,0.95)' }}
        >
          <div className="flex items-center gap-2">
            <Gauge size={16} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Operational Snapshot</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <span className="text-muted-foreground">Clients Needing Attention</span>
              <span className="text-foreground font-semibold">{data.compactMetrics.clientsNeedingAttention}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <span className="text-muted-foreground">Replies Pending</span>
              <span className="text-foreground font-semibold">{data.compactMetrics.quickRepliesPending}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <span className="text-muted-foreground">Sessions Today</span>
              <span className="text-foreground font-semibold">{data.compactMetrics.sessionsToday}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
