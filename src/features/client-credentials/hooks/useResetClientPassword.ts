'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { resetClientPassword } from '@/features/client-credentials/api/clientCredentials.api';
import type { ResetClientPasswordResponse } from '@/features/client-credentials/types/clientCredentials.types';

export function useResetClientPassword(clientId: string) {
  const { mutate } = useSWRConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resetPassword(): Promise<ResetClientPasswordResponse | null> {
    setIsLoading(true);
    setError(null);
    try {
      const result = await resetClientPassword(clientId);
      await mutate(`/api/clients/${encodeURIComponent(clientId)}`);
      return result;
    } catch (err: any) {
      setError(err?.message ?? 'Failed to reset password');
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { resetPassword, isLoading, error };
}
