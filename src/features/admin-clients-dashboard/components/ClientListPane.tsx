import Image from 'next/image';
import { Plus, Search, Users } from 'lucide-react';
import type { AdminClientListItem } from '@/features/admin-clients-dashboard/types/adminClientsDashboard.types';

export function ClientListPane({
  clients,
  selectedClientId,
  search,
  viewMode,
  onAddClientAction,
  onSearchChangeAction,
  onSelectClientAction,
  onViewModeChangeAction,
}: {
  clients: AdminClientListItem[];
  selectedClientId: string | null;
  search: string;
  viewMode: 'active' | 'archived';
  onAddClientAction: () => void;
  onSearchChangeAction: (value: string) => void;
  onSelectClientAction: (clientId: string) => void;
  onViewModeChangeAction: (mode: 'active' | 'archived') => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/10 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-muted-foreground">
              <Users size={15} />
            </span>
            <h2 className="text-sm font-semibold text-foreground">
              Clients
            </h2>
          </div>

          {viewMode === 'active' && (
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

        <div className="mb-3 flex overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {(['active', 'archived'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChangeAction(mode)}
              className={[
                'flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize transition-colors',
                viewMode === mode
                  ? 'bg-[var(--color-accent)] text-[var(--color-text-on-accent)]'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {mode}
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

      <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
        {clients.map(client => {
          const isSelected = client.id === selectedClientId;

          return (
            <button
              key={client.id}
              type="button"
              onClick={() => onSelectClientAction(client.id)}
              className={[
                'w-full rounded-2xl border p-3 text-left transition-colors',
                isSelected
                  ? 'border-[var(--color-accent)]/45 bg-[var(--color-accent-translucent)]'
                  : 'border-transparent bg-white/[0.025] hover:border-white/10 hover:bg-white/[0.045]',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <div
                  className="relative h-10 w-10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
                >
                  <Image
                    src={client.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}`}
                    alt={client.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {client.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {client.email}
                  </p>
                </div>
                <span
                  className={[
                    'h-2 w-2 shrink-0 rounded-full',
                    client.status === 'ACTIVE' ? 'bg-emerald-400' : client.status === 'ARCHIVED' ? 'bg-slate-500' : 'bg-amber-400',
                  ].join(' ')}
                  aria-label={client.status}
                />
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
