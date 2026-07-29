'use client';

import { useState } from 'react';
import { getClientCredentials } from '@/features/client-credentials/api/clientCredentials.api';
import type { ClientCredentials } from '@/features/client-credentials/types/clientCredentials.types';

export function useClientCredentials(clientId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCredentials(): Promise<ClientCredentials | null> {
    setIsLoading(true);
    setError(null);
    try {
      return await getClientCredentials(clientId);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load credentials');
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { loadCredentials, isLoading, error };
}
