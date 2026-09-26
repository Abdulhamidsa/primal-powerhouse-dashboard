'use client';

import { useMemo, useState } from 'react';
import { HandshakeIcon as Handshake, PlusIcon as Plus, TrendUpIcon as TrendingUp } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { AdminPage, AdminPageHeader, AdminPanel } from '@/features/admin-shell/components/AdminPage';
import { ClientLeadsTable } from '@/features/client-leads/components/ClientLeadsTable';
import { AddClientLeadModal } from '@/features/client-leads/components/AddClientLeadModal';
import { ConvertLeadModal } from '@/features/client-leads/components/ConvertLeadModal';
import { useClientLeads } from '@/features/client-leads/hooks/useClientLeads';
import type { ClientLead } from '@/features/client-leads/types/clientLead.types';

export default function DealsPage() {
  const { leads, refresh } = useClientLeads();
  const [showAddModal, setShowAddModal] = useState(false);
  const [convertingLead, setConvertingLead] = useState<ClientLead | null>(null);

  const activeCount = useMemo(
    () => leads.filter(lead => lead.status !== 'CONVERTED').length,
    [leads],
  );

  return (
    <AdminPage className="max-w-none">
      <AdminPageHeader
        eyebrow="Client pipeline"
        title="Deals Pipeline"
        description="Track prospects from first contact through meetings, signed deals, and converted clients."
        actions={
          <>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-muted-foreground">
              <TrendingUp aria-hidden="true" focusable="false" size={15} className="text-[var(--color-accent)]" />
              {activeCount} active · {leads.length} total
            </div>
            <Button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="gap-2 rounded-xl bg-[var(--color-accent)] text-[var(--color-text-on-accent)] hover:opacity-90"
            >
              <Plus aria-hidden="true" focusable="false" size={16} />
              Add Lead
            </Button>
          </>
        }
      />

      <AdminPanel className="overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--color-accent)]">
              <Handshake aria-hidden="true" focusable="false" size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Lead board</h2>
              <p className="mt-1 text-xs text-muted-foreground">Move leads with status controls. Convert only after a deal is made.</p>
            </div>
          </div>
        </div>
        <ClientLeadsTable onConvertAction={setConvertingLead} />
      </AdminPanel>

      <AddClientLeadModal
        isOpen={showAddModal}
        onCloseAction={() => setShowAddModal(false)}
        onLeadAddedAction={() => setShowAddModal(false)}
      />

      {convertingLead && (
        <ConvertLeadModal
          lead={convertingLead}
          onCloseAction={() => setConvertingLead(null)}
          onConvertedAction={() => {
            setConvertingLead(null);
            refresh();
          }}
        />
      )}
    </AdminPage>
  );
}
