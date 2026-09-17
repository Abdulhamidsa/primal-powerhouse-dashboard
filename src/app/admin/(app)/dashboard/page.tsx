'use client';

import { AdminCommandCenterView } from '@/features/admin-command-center/components/AdminCommandCenterView';
import { useAdminCommandCenter } from '@/features/admin-command-center/hooks/useAdminCommandCenter';
import { AdminPage, AdminPageHeader, AdminPanel } from '@/features/admin-shell/components/AdminPage';

export default function AdminDashboard() {
  const { data, error, isLoading, busyItemId, actionError, quickReplyTemplate, quickMessage, markReviewed } =
    useAdminCommandCenter();

  if (isLoading && !data) {
    return (
      <AdminPage>
        <div className="animate-pulse rounded-[28px] border border-white/10 bg-white/[0.035] px-6 py-5">
          <div className="h-3 w-36 rounded-full bg-white/10" />
          <div className="mt-4 h-8 w-64 rounded-xl bg-white/10" />
          <div className="mt-3 h-4 w-full max-w-2xl rounded-full bg-white/10" />
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-[22px] border border-white/10 bg-white/[0.035]" />
          ))}
        </div>

        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(390px,0.65fr)]">
          <div className="h-[520px] animate-pulse rounded-[24px] border border-white/10 bg-white/[0.035]" />
          <div className="grid gap-5">
            <div className="h-64 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.035]" />
            <div className="h-64 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.035]" />
          </div>
        </div>
      </AdminPage>
    );
  }

  if (error || !data) {
    return (
      <AdminPage>
        <AdminPageHeader
          eyebrow="Coach operations"
          title="Command Center"
          description="Prioritize clients, clear risks, and handle the highest-leverage actions without jumping between pages."
        />
        <AdminPanel className="p-6">
          <h2 className="text-lg font-semibold text-foreground">Unable to load dashboard</h2>
          <p className="mt-2 text-sm text-muted-foreground">Please refresh and try again.</p>
        </AdminPanel>
      </AdminPage>
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
