'use client';

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import type { ApiError } from '@/lib/request';
import {
  buildClientProfileEditUrl,
  updateClientProfile,
} from '@/features/client-profile-edit/api/clientProfileEdit.api';
import type {
  ClientProfileEditPayload,
  ClientProfileEditResponse,
} from '@/features/client-profile-edit/types/clientProfileEdit.types';

export function useClientProfileEdit(clientId: string) {
  const { mutate } = useSWRConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const submit = async (payload: ClientProfileEditPayload): Promise<ClientProfileEditResponse> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateClientProfile(clientId, payload);
      await mutate(buildClientProfileEditUrl(clientId));
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      throw apiError;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submit,
    isSubmitting,
    error,
  };
}
