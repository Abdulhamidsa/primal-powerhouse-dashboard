import Image from 'next/image';
import { Search, Users } from 'lucide-react';
import type { AdminClientListItem } from '@/features/admin-clients-dashboard/types/adminClientsDashboard.types';

export function ClientListPane({
  clients,
  selectedClientId,
  search,
  onSearchChangeAction,
  onSelectClientAction,
}: {
  clients: AdminClientListItem[];
  selectedClientId: string | null;
  search: string;
  onSearchChangeAction: (value: string) => void;
  onSelectClientAction: (clientId: string) => void;
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} style={{ color: 'var(--color-text-muted)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Clients
          </h2>
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
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                    {client.email}
                  </p>
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
