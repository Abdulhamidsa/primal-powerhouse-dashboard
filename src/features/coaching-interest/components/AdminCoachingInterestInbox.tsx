'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Check, Clock3, Mail, Phone, RotateCcw, Search, Send, UserRound } from 'lucide-react';
import { useAdminCoachingInterests } from '@/features/coaching-interest/hooks/useAdminCoachingInterests';
import type {
  AdminCoachingInterest,
  AdminCoachingInterestStatus,
} from '@/features/coaching-interest/types/coachingInterest.types';

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return (words[0]?.[0] ?? '?').toUpperCase();
  return `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`.toUpperCase();
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

function RequestAvatar({ request, size = 'large' }: { request: AdminCoachingInterest; size?: 'small' | 'large' }) {
  const classes = size === 'small' ? 'h-11 w-11 rounded-2xl text-sm' : 'h-14 w-14 rounded-[20px] text-base';
  if (request.clientAvatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={request.clientAvatar} alt="" className={`${classes} shrink-0 object-cover`} />
    );
  }
  return (
    <div className={`grid ${classes} shrink-0 place-items-center border border-white/10 bg-white/[0.05] font-bold text-[var(--color-accent)]`}>
      {getInitials(request.clientName)}
    </div>
  );
}

export function AdminCoachingInterestInbox() {
  const [status, setStatus] = useState<AdminCoachingInterestStatus>('pending');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { items, pendingCount, isLoading, error, updatingId, updateError, setContacted } =
    useAdminCoachingInterests(status);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(item =>
      [item.clientName, item.email, item.phone].filter(Boolean).join(' ').toLowerCase().includes(query),
    );
  }, [items, search]);
  const selected = visibleItems.find(item => item.id === selectedId) ?? visibleItems[0] ?? null;

  useEffect(() => {
    if (selected && selected.id !== selectedId) setSelectedId(selected.id);
    if (!selected && selectedId) setSelectedId(null);
  }, [selected, selectedId]);

  return (
    <div className="flex h-full min-h-0 bg-[rgba(8,8,10,0.42)]">
      <aside className="flex w-[360px] shrink-0 flex-col border-r border-white/10">
        <div className="shrink-0 border-b border-white/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">Interest queue</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">Readiness requests</h2>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
              <p className="text-sm font-semibold text-foreground">{pendingCount}</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">pending</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-black/20 p-1">
            {(['pending', 'contacted', 'all'] as const).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setStatus(option)}
                className={`rounded-xl px-2 py-2 text-xs font-semibold capitalize transition-colors ${
                  status === option ? 'bg-[var(--color-accent)] text-[var(--color-text-on-accent)]' : 'text-muted-foreground hover:bg-white/[0.05]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search requests..."
              className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-[var(--color-accent)]/45"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {isLoading ? (
            [0, 1, 2].map(item => <div key={item} className="h-[76px] animate-pulse rounded-[20px] border border-white/10 bg-white/[0.035]" />)
          ) : error ? (
            <EmptyState title="Could not load requests" description="Refresh the page and try again." />
          ) : visibleItems.length === 0 ? (
            <EmptyState
              title={search ? 'No requests found' : `No ${status === 'all' ? '' : status} requests`}
              description={search ? 'Try a different name or contact detail.' : 'New readiness signals will appear here.'}
            />
          ) : (
            visibleItems.map(request => {
              const isSelected = selected?.id === request.id;
              return (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => setSelectedId(request.id)}
                  className={`flex w-full items-center gap-3 rounded-[20px] border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent-translucent)]'
                      : 'border-white/10 bg-white/[0.025] hover:bg-white/[0.055]'
                  }`}
                >
                  <RequestAvatar request={request} size="small" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{request.clientName}</p>
                      <span className={`h-2 w-2 shrink-0 rounded-full ${request.contactedAt ? 'bg-emerald-400' : 'bg-[var(--color-accent)]'}`} />
                    </div>
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">{request.email}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(request.requestedAt)}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="min-w-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--color-accent)_7%,transparent),transparent_38%)] p-6">
        {selected ? (
          <div className="mx-auto max-w-2xl">
            <div className="flex items-start gap-4">
              <RequestAvatar request={selected} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">{selected.clientName}</h2>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                    selected.contactedAt
                      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
                      : 'border-[var(--color-accent)]/30 bg-[var(--color-accent-translucent)] text-[var(--color-accent)]'
                  }`}>
                    {selected.contactedAt ? 'Contacted' : 'Pending'}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Clock3 size={14} /> Requested {formatDate(selected.requestedAt)}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Fixed readiness signal</p>
              <p className="mt-3 text-sm leading-6 text-foreground">{selected.message}</p>
              <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] px-4 py-3 text-xs leading-5 text-amber-100/75">
                This is not a live chat. The client cannot read replies here; contact them outside the app using their registered details.
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a href={`mailto:${selected.email}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition-colors hover:bg-white/[0.06]">
                <Mail size={18} className="text-[var(--color-accent)]" />
                <div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Email</p><p className="mt-1 truncate text-sm text-foreground">{selected.email}</p></div>
              </a>
              {selected.phone ? (
                <a href={`tel:${selected.phone}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition-colors hover:bg-white/[0.06]">
                  <Phone size={18} className="text-[var(--color-accent)]" />
                  <div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Phone</p><p className="mt-1 truncate text-sm text-foreground">{selected.phone}</p></div>
                </a>
              ) : (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-muted-foreground"><Phone size={18} /><p className="text-sm">No phone saved</p></div>
              )}
            </div>

            {selected.contactedAt ? <p className="mt-4 text-xs text-muted-foreground">Marked contacted {formatDate(selected.contactedAt)}</p> : null}
            {updateError ? <p role="alert" className="mt-4 text-sm text-red-400">{updateError}</p> : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={updatingId === selected.id}
                onClick={() => void setContacted(selected.id, !selected.contactedAt)}
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-text-on-accent)] disabled:opacity-60"
              >
                {selected.contactedAt ? <RotateCcw size={16} /> : <Check size={16} />}
                {updatingId === selected.id ? 'Updating…' : selected.contactedAt ? 'Move back to pending' : 'Mark contacted'}
              </button>
              <Link href={`/admin/clients?clientId=${encodeURIComponent(selected.clientId)}`} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-foreground hover:bg-white/[0.07]">
                <UserRound size={16} /> Open client profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex min-h-full items-center justify-center text-center">
            <div className="max-w-sm rounded-[28px] border border-white/10 bg-white/[0.035] px-6 py-7">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--color-accent)]"><Send size={22} /></div>
              <p className="mt-4 text-base font-semibold text-foreground">No request selected</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose a readiness request to review its contact details.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="px-4 py-10 text-center"><p className="text-sm font-semibold text-foreground">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>;
}
