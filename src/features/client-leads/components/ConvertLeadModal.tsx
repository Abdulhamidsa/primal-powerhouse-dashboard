'use client';

import { useRef } from 'react';
import NewAddClientModal from '@/components/NewAddClientModal';
import { useUpdateClientLead } from '@/features/client-leads/hooks/useUpdateClientLead';
import type { ClientLead } from '@/features/client-leads/types/clientLead.types';

type Props = {
  lead: ClientLead;
  onCloseAction: () => void;
  onConvertedAction: () => void;
};

export function ConvertLeadModal({ lead, onCloseAction, onConvertedAction }: Props) {
  const { updateLead } = useUpdateClientLead();
  const credentialsRef = useRef<{ email: string; password: string } | null>(null);

  async function handleCredentialsCreated(credentials: { email: string; password: string }) {
    credentialsRef.current = credentials;
  }

  async function handleClientAdded() {
    if (credentialsRef.current) {
      await updateLead(lead.id, {
        status: 'CONVERTED',
        credentialEmail: credentialsRef.current.email,
        credentialPassword: credentialsRef.current.password,
      });
    }
    onConvertedAction();
  }

  return (
    <NewAddClientModal
      isOpen
      onCloseAction={onCloseAction}
      onClientAddedAction={handleClientAdded}
      prefillData={{ name: lead.name, email: lead.email, phone: lead.phone ?? undefined }}
      onCredentialsCreated={handleCredentialsCreated}
    />
  );
}
