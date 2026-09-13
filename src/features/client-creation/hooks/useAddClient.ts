'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { buildClientsUrl, createClient } from '@/features/client-creation/api/clientCreation.api';
import type { CreateClientPayload, CreateClientResponse } from '@/features/client-creation/types/clientCreation.types';

export function useAddClient() {
  const { mutate } = useSWRConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addClient(payload: CreateClientPayload): Promise<CreateClientResponse> {
    setIsLoading(true);
    setError(null);
    try {
      const created = await createClient(payload);
      await mutate((key: unknown) => typeof key === 'string' && (key === buildClientsUrl() || key.startsWith('/api/clients?')));
      return created;
    } catch (err: any) {
      const message = err?.message ?? 'Failed to create client';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  return { addClient, isLoading, error };
}
