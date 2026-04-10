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
      <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Users size={16} style={{ color: 'var(--color-text-muted)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Clients
            </h2>
          </div>

          {viewMode === 'active' && (
            <button
              type="button"
              onClick={onAddClientAction}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-text)',
              }}
            >
              <Plus size={16} />
              Add Client
            </button>
          )}
        </div>

        <div className="flex rounded-lg overflow-hidden border mb-3" style={{ borderColor: 'var(--color-border)' }}>
          {(['active', 'archived'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChangeAction(mode)}
              className="flex-1 py-1.5 text-xs font-medium transition-colors capitalize"
              style={{
                background: viewMode === mode ? 'var(--color-accent)' : 'var(--color-bg-alt)',
                color: viewMode === mode ? 'var(--color-text)' : 'var(--color-text-muted)',
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            value={search}
            onChange={event => onSearchChangeAction(event.target.value)}
            placeholder="Search clients"
            className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg-alt)',
              color: 'var(--color-text)',
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {clients.map(client => {
          const isSelected = client.id === selectedClientId;

          return (
            <button
              key={client.id}
              type="button"
              onClick={() => onSelectClientAction(client.id)}
              className="w-full text-left rounded-xl border p-3 transition-colors"
              style={{
                borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-border)',
                background: isSelected ? 'var(--color-accent-muted)' : 'var(--color-surface)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="relative w-10 h-10 rounded-full overflow-hidden border"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <Image
                    src={client.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(client.name)}`}
                    alt={client.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                    {client.name}
                  </p>
                  {/* <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                    {client.email}
                  </p> */}
                </div>
              </div>
            </button>
          );
        })}

        {clients.length === 0 ? (
          <p className="text-sm p-3" style={{ color: 'var(--color-text-muted)' }}>
            No clients found.
          </p>
        ) : null}
      </div>
    </div>
  );
}
