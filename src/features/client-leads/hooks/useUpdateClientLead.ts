'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { updateClientLead, buildClientLeadsUrl } from '@/features/client-leads/api/clientLead.api';
import type { UpdateClientLeadPayload, ClientLead } from '@/features/client-leads/types/clientLead.types';

export function useUpdateClientLead() {
  const { mutate } = useSWRConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateLead(id: string, payload: UpdateClientLeadPayload): Promise<ClientLead | null> {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await updateClientLead(id, payload);
      await mutate(
        buildClientLeadsUrl(),
        (current: ClientLead[] = []) => current.map(l => (l.id === id ? updated : l)),
        { revalidate: false },
      );
      return updated;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update lead');
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { updateLead, isLoading, error };
}
