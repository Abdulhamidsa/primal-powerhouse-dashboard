'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  PulseIcon as Activity,
  ArrowRightIcon as ArrowRight,
  CheckCircleIcon as CheckCircle2,
  ClockIcon as Clock3,
  GaugeIcon as Gauge,
  ChatTextIcon as MessageSquare,
  ShieldWarningIcon as ShieldAlert,
  TrendUpIcon,
  UsersIcon as Users,
} from '@phosphor-icons/react';
import { AdminPage, AdminPageHeader, AdminPanel, AdminPanelHeader } from '@/features/admin-shell/components/AdminPage';
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
  if (severity === 'critical') return 'Needs attention';
  if (severity === 'warning') return 'At risk';
  return 'Watch';
}

function severityTone(severity: CommandCenterSeverity): {
  text: string;
  bg: string;
  border: string;
  dot: string;
} {
  if (severity === 'critical') {
    return { text: 'text-red-200', bg: 'bg-red-500/10', border: 'border-red-400/30', dot: 'bg-red-400' };
  }

  if (severity === 'warning') {
    return { text: 'text-amber-200', bg: 'bg-amber-500/10', border: 'border-amber-400/30', dot: 'bg-amber-400' };
  }

  return { text: 'text-slate-200', bg: 'bg-slate-400/10', border: 'border-slate-300/20', dot: 'bg-slate-300' };
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

function MetricCard({
  label,
  value,
  helper,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
  tone?: 'neutral' | 'danger' | 'accent' | 'success';
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-red-400/25 bg-red-500/10 text-red-100'
      : tone === 'success'
        ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100'
        : tone === 'accent'
          ? 'border-[var(--color-accent)]/30 bg-[var(--color-accent-translucent)] text-foreground'
          : 'border-white/10 bg-white/[0.035] text-foreground';

  return (
    <div className={`rounded-[22px] border p-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{value}</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/15 text-[var(--color-accent)]">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function IssueChip({ issue }: { issue: CommandCenterIssue }) {
  const tone = severityTone(issue.severity);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${tone.border} ${tone.bg} ${tone.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {issue.title}
    </span>
  );
}

function ActionLink({ href, children, muted = false }: { href: string; children: ReactNode; muted?: boolean }) {
  return (
    <Link
      href={href}
      className={
        muted
          ? 'inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground'
          : 'inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-2.5 text-xs font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90'
      }
    >
      {children}
    </Link>
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

  return (
    <article className={`rounded-2xl border ${tone.border} ${tone.bg} p-4 transition-colors hover:bg-white/[0.045]`}>
      <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              {severityLabel(item.severity)}
            </span>
            <span className="text-xs text-muted-foreground">{relativeTimeLabel(item.occurredAt)}</span>
            <span className="text-xs text-muted-foreground">
              {item.issueCount} issue{item.issueCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="mt-2">
            <h3 className="text-base font-semibold text-foreground">{item.clientName}</h3>
            <p className="mt-1 text-sm font-medium text-foreground/90">{item.title}</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{item.detail}</p>
          </div>

          {item.issues.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.issues.slice(0, 4).map(issue => (
                <IssueChip key={issue.id} issue={issue} />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 xl:max-w-[360px] xl:justify-end">
          {quickMessageAction ? (
            <button
              type="button"
              onClick={() =>
                onQuickMessage(item.clientId, quickMessageAction.messageTemplate || quickReplyTemplate[item.severity])
              }
              disabled={busyItemId === item.clientId}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-2.5 text-xs font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <MessageSquare aria-hidden="true" focusable="false" size={13} /> Message
            </button>
          ) : null}

          {reviewedAction?.checkInId ? (
            <button
              type="button"
              onClick={() => onMarkReviewed(item.clientId, reviewedAction.checkInId as string)}
              disabled={busyItemId === reviewedAction.checkInId}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.04] disabled:opacity-60"
            >
              <CheckCircle2 aria-hidden="true" focusable="false" size={13} /> Reviewed
            </button>
          ) : null}

          {assignMealAction?.href ? (
            <ActionLink href={assignMealAction.href} muted>
              Meal
            </ActionLink>
          ) : null}
          {assignWorkoutAction?.href ? (
            <ActionLink href={assignWorkoutAction.href} muted>
              Workout
            </ActionLink>
          ) : null}
          {openClientAction?.href ? (
            <ActionLink href={openClientAction.href} muted>
              Open <ArrowRight aria-hidden="true" focusable="false" size={12} />
            </ActionLink>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function RecentChangeRow({ change }: { change: CommandCenterRecentChange }) {
  const openClientAction = actionByKind(change.actions, 'open_client');

  return (
    <div className="grid gap-3 border-b border-white/10 px-5 py-3 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-foreground">{change.clientName}</p>
          <span className="rounded-full border border-white/10 bg-white/[0.035] px-2 py-0.5 text-[11px] capitalize text-muted-foreground">
            {change.category.replace('_', ' ')}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{change.text}</p>
      </div>
      <div className="flex items-center gap-3 sm:justify-end">
        <span className="text-xs text-muted-foreground">{relativeTimeLabel(change.occurredAt)}</span>
        {openClientAction?.href ? (
          <Link href={openClientAction.href} className="text-xs font-medium text-[var(--color-accent)] hover:underline">
            Open
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function EmptyPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="m-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-5">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
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
  const attentionItems = [...(critical?.items ?? []), ...(warning?.items ?? []), ...(watch?.items ?? [])];
  const attentionCount = attentionItems.length;

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Coach operations"
        title="Command Center"
        description="Prioritize clients, clear risks, and handle the highest-leverage actions without jumping between pages."
        actions={
          <Link
            href="/admin/clients"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.07]"
          >
            <Users aria-hidden="true" focusable="false" size={15} />
            Open clients
          </Link>
        }
      />

      {actionError ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {actionError}
        </div>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Attention"
          value={data.compactMetrics.clientsNeedingAttention}
          helper={attentionCount ? `${attentionCount} queue item${attentionCount === 1 ? '' : 's'}` : 'Queue clear'}
          icon={<ShieldAlert aria-hidden="true" focusable="false" size={18} />}
          tone={data.compactMetrics.clientsNeedingAttention > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          label="Replies"
          value={data.compactMetrics.quickRepliesPending}
          helper="Coach messages to send"
          icon={<MessageSquare aria-hidden="true" focusable="false" size={18} />}
          tone="accent"
        />
        <MetricCard
          label="Sessions"
          value={data.compactMetrics.sessionsToday}
          helper="Training activity today"
          icon={<Activity aria-hidden="true" focusable="false" size={18} />}
        />
        <MetricCard
          label="Last refresh"
          value={relativeTimeLabel(data.generatedAt)}
          helper="Command center snapshot"
          icon={<Gauge aria-hidden="true" focusable="false" size={18} />}
        />
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(390px,0.65fr)]">
        <AdminPanel className="overflow-hidden">
          <AdminPanelHeader
            icon={<ShieldAlert aria-hidden="true" focusable="false" size={17} />}
            title="Needs attention"
            description="The highest-priority client situations, ordered by severity."
            meta={
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {attentionCount} active
              </span>
            }
          />

          {attentionItems.length ? (
            <div className="space-y-3 p-5">
              {attentionItems.map(item => (
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
          ) : (
            <EmptyPanel
              title="Queue is clear"
              description="No urgent clients right now. Use the free space to review recent changes or proactively message watch clients."
            />
          )}
        </AdminPanel>

        <div className="grid gap-5">
          <AdminPanel className="overflow-hidden">
            <AdminPanelHeader
              icon={<Clock3 aria-hidden="true" focusable="false" size={17} />}
              title="Today actions"
              description="Small tasks that keep clients moving."
              meta={
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {data.todayActions.length}
                </span>
              }
            />

            {data.todayActions.length ? (
              <div className="divide-y divide-white/10">
                {data.todayActions.map(action => {
                  const quickMessageAction = actionByKind(action.actions, 'quick_message');
                  const openClientAction = actionByKind(action.actions, 'open_client');

                  return (
                    <div key={action.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{action.clientName}</p>
                          <p className="mt-1 text-sm text-foreground/90">{action.title}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{action.detail}</p>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {relativeTimeLabel(action.dueAt)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {quickMessageAction ? (
                          <button
                            type="button"
                            onClick={() =>
                              onQuickMessage(
                                action.clientId,
                                quickMessageAction.messageTemplate || 'Quick check-in from your coach.',
                              )
                            }
                            disabled={busyItemId === action.clientId}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-2.5 text-xs font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90 disabled:opacity-60"
                          >
                            <MessageSquare aria-hidden="true" focusable="false" size={13} /> Message
                          </button>
                        ) : null}
                        {openClientAction?.href ? (
                          <ActionLink href={openClientAction.href} muted>
                            Open <ArrowRight aria-hidden="true" focusable="false" size={12} />
                          </ActionLink>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyPanel
                title="No pending actions"
                description="Everything that needed a coach action today is clear."
              />
            )}
          </AdminPanel>

          <AdminPanel className="overflow-hidden">
            <AdminPanelHeader
              icon={<TrendUpIcon aria-hidden="true" focusable="false" size={17} />}
              title="Momentum"
              description="Positive signals worth reinforcing."
            />

            {data.momentum.length ? (
              <div className="divide-y divide-white/10">
                {data.momentum.map(item => (
                  <div key={item.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{item.clientName}</p>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200">
                        On track
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground/90">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPanel
                title="No momentum signals yet"
                description="Workout completions, check-ins, and nutrition wins will appear here."
              />
            )}
          </AdminPanel>
        </div>
      </section>

      <AdminPanel className="overflow-hidden">
        <AdminPanelHeader
          icon={<Activity aria-hidden="true" focusable="false" size={17} />}
          title="Recent changes"
          description="Latest messages, check-ins, nutrition updates, and training activity."
          meta={
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {data.recentChanges.length}
            </span>
          }
        />

        {data.recentChanges.length ? (
          <div>
            {data.recentChanges.map(change => (
              <RecentChangeRow key={change.id} change={change} />
            ))}
          </div>
        ) : (
          <EmptyPanel title="No recent updates" description="Client activity will appear here as it comes in." />
        )}
      </AdminPanel>
    </AdminPage>
  );
}
