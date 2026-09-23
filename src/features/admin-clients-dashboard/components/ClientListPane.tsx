import Image from 'next/image';
import { Plus, Search, Users } from 'lucide-react';
import type { AdminClientListItem, AdminClientStatus } from '@/features/admin-clients-dashboard/types/adminClientsDashboard.types';

export function ClientListPane({
  clients,
  selectedClientId,
  search,
  viewMode,
  counts,
  onAddClientAction,
  onSearchChangeAction,
  onSelectClientAction,
  onViewModeChangeAction,
}: {
  clients: AdminClientListItem[];
  selectedClientId: string | null;
  search: string;
  viewMode: AdminClientStatus;
  counts: Record<AdminClientStatus, number>;
  onAddClientAction: () => void;
  onSearchChangeAction: (value: string) => void;
  onSelectClientAction: (clientId: string) => void;
  onViewModeChangeAction: (mode: AdminClientStatus) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/10 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-muted-foreground">
              <Users size={15} />
            </span>
            <div>
            <h2 className="text-sm font-semibold text-foreground">
              Clients
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{clients.length} {viewMode.toLowerCase()} clients</p>
            </div>
          </div>

          {viewMode === 'ACTIVE' && (
            <button
              type="button"
              onClick={onAddClientAction}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-[var(--color-text-on-accent)] transition-opacity hover:opacity-90"
            >
              <Plus size={14} />
              Add
            </button>
          )}
        </div>

        <div className="mb-3 grid grid-cols-3 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {(['ACTIVE', 'INACTIVE', 'ARCHIVED'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChangeAction(mode)}
              className={[
                'rounded-lg py-2 text-[11px] font-semibold transition-colors',
                viewMode === mode
                  ? 'bg-[var(--color-accent)] text-[var(--color-text-on-accent)]'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              <span className="block">{mode === 'ACTIVE' ? 'Active' : mode === 'INACTIVE' ? 'Inactive' : 'Archived'}</span>
              <span className="mt-0.5 block text-[10px] opacity-70">{counts[mode]}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={event => onSearchChangeAction(event.target.value)}
            placeholder="Search clients"
            className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.035] pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[var(--color-accent)]"
          />
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {[...clients.filter(client => client.isSystemTemplate), ...clients.filter(client => !client.isSystemTemplate)].map(client => {
          const isSelected = client.id === selectedClientId;

          return (
            <button
              key={client.id}
              type="button"
              onClick={() => onSelectClientAction(client.id)}
              className={[
                'relative w-full rounded-2xl border p-3.5 text-left transition-colors',
                isSelected
                  ? 'border-[var(--color-accent)]/45 bg-[var(--color-accent-translucent)] before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:rounded-full before:bg-[var(--color-accent)]'
                  : 'border-transparent bg-white/[0.025] hover:border-white/10 hover:bg-white/[0.045]',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <div
                  className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
                >
                  <span className="absolute inset-0 grid place-items-center text-sm font-semibold text-muted-foreground">
                    {client.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <Image
                    src={client.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}`}
                    alt={client.name}
                    fill
                    sizes="44px"
                    className="object-cover"
                    onError={event => { event.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {client.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {client.email}
                  </p>
                  {client.status === 'INACTIVE' && client.deletionScheduledFor ? (
                    <p className="truncate text-[10px] text-amber-200/80">
                      Deletion scheduled {new Date(client.deletionScheduledFor).toLocaleDateString()}
                    </p>
                  ) : null}
                </div>
                {client.isSystemTemplate ? (
                  <span className="shrink-0 rounded-full border border-violet-300/30 bg-violet-400/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
                    System template
                  </span>
                ) : <span
                  className={[
                    'shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide',
                    client.status === 'ACTIVE' ? 'bg-emerald-400' : client.status === 'ARCHIVED' ? 'bg-slate-500' : 'bg-amber-400',
                  ].join(' ')}
                  aria-label={client.status}
                >{client.status === 'ACTIVE' ? 'Active' : client.status === 'ARCHIVED' ? 'Archived' : 'Inactive'}</span>}
              </div>
            </button>
          );
        })}

        {clients.length === 0 ? (
          <p className="p-3 text-sm text-muted-foreground">
            No clients found.
          </p>
        ) : null}
      </div>
    </div>
  );
}
