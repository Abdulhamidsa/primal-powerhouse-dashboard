'use client';

import { CloudSlashIcon as CloudOff, ArrowsClockwiseIcon as RefreshCw } from '@phosphor-icons/react';
import { useOfflineStatus } from '@/features/offline/components/OfflineProvider';

function formatSavedAt(value: string | null): string {
  if (!value) return 'No saved data yet';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function OfflineStatusBanner() {
  const { isOffline, isSyncing, lastSyncedAt, syncNow } = useOfflineStatus();
  if (!isOffline) return null;

  return (
    <div className="sticky top-0 z-[60] border-b border-amber-500/30 bg-amber-500/15 px-4 py-2 text-amber-950 backdrop-blur dark:text-amber-100" role="status">
      <div className="mx-auto flex max-w-xl items-center gap-2 text-xs font-medium">
        <CloudOff size={16} className="shrink-0" />
        <span className="min-w-0 flex-1">Offline — showing data saved {formatSavedAt(lastSyncedAt)}.</span>
        <button
          type="button"
          onClick={() => void syncNow()}
          disabled={isSyncing || !navigator.onLine}
          className="inline-flex items-center gap-1 rounded-full border border-current/25 px-2 py-1 disabled:opacity-50"
        >
          <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
          Retry
        </button>
      </div>
    </div>
  );
}
