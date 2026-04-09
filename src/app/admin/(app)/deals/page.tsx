'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ClientLeadsTable } from '@/features/client-leads/components/ClientLeadsTable';
import { AddClientLeadModal } from '@/features/client-leads/components/AddClientLeadModal';
import { ConvertLeadModal } from '@/features/client-leads/components/ConvertLeadModal';
import { useClientLeads } from '@/features/client-leads/hooks/useClientLeads';
import type { ClientLead } from '@/features/client-leads/types/clientLead.types';

export default function DealsPage() {
  const { leads, refresh } = useClientLeads();
  const [showAddModal, setShowAddModal] = useState(false);
  const [convertingLead, setConvertingLead] = useState<ClientLead | null>(null);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Deals
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {leads.length} lead{leads.length !== 1 ? 's' : ''} in your pipeline
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
          style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
        >
          <Plus size={16} />
          Add Lead
        </button>
      </div>

      {/* Table */}
      <ClientLeadsTable onConvertAction={setConvertingLead} />

      {/* Add Lead Modal */}
      <AddClientLeadModal
        isOpen={showAddModal}
        onCloseAction={() => setShowAddModal(false)}
        onLeadAddedAction={() => setShowAddModal(false)}
      />

      {/* Convert Lead Modal */}
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
    </div>
  );
}
