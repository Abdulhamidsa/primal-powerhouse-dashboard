'use client';

import { AdminCommandCenterView } from '@/features/admin-command-center/components/AdminCommandCenterView';
import { useAdminCommandCenter } from '@/features/admin-command-center/hooks/useAdminCommandCenter';

export default function AdminDashboard() {
  const { data, error, isLoading, busyItemId, actionError, quickReplyTemplate, quickMessage, markReviewed } =
    useAdminCommandCenter();

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <div className="card-base p-6 animate-pulse">
          <div className="h-5 w-56 rounded bg-muted/50 mb-3" />
          <div className="h-4 w-80 rounded bg-muted/50" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card-base h-64 animate-pulse bg-muted/20" />
          <div className="card-base h-64 animate-pulse bg-muted/20" />
          <div className="card-base h-64 animate-pulse bg-muted/20" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card-base p-6 space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Coach Command Center</h1>
        <p className="text-sm text-muted-foreground">Unable to load command center right now. Please refresh.</p>
      </div>
    );
  }

  return (
    <AdminCommandCenterView
      data={data}
      busyItemId={busyItemId}
      actionError={actionError}
      onQuickMessage={quickMessage}
      onMarkReviewed={markReviewed}
      quickReplyTemplate={quickReplyTemplate}
    />
  );
}
