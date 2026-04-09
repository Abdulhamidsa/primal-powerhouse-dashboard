'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { deleteClientLead, buildClientLeadsUrl } from '@/features/client-leads/api/clientLead.api';
import type { ClientLead } from '@/features/client-leads/types/clientLead.types';

export function useDeleteClientLead() {
  const { mutate } = useSWRConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteLead(id: string): Promise<boolean> {
    setIsLoading(true);
    setError(null);
    try {
      await deleteClientLead(id);
      await mutate(buildClientLeadsUrl(), (current: ClientLead[] = []) => current.filter(l => l.id !== id), {
        revalidate: false,
      });
      return true;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete lead');
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return { deleteLead, isLoading, error };
}
