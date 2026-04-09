'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { createClientLead, buildClientLeadsUrl } from '@/features/client-leads/api/clientLead.api';
import type { CreateClientLeadPayload } from '@/features/client-leads/types/clientLead.types';

export function useAddClientLead() {
  const { mutate } = useSWRConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addLead(payload: CreateClientLeadPayload): Promise<boolean> {
    setIsLoading(true);
    setError(null);
    try {
      const created = await createClientLead(payload);
      await mutate(buildClientLeadsUrl(), (current: any[] = []) => [created, ...current], {
        revalidate: false,
      });
      return true;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create lead');
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return { addLead, isLoading, error };
}
