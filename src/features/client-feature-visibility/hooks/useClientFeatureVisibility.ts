import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import {
  getClientFeatureVisibility,
  updateClientFeatureVisibility,
  buildClientFeatureVisibilityUrl,
} from '../api/clientFeatureVisibility.api';
import { ClientFeatureVisibilityResponse, ClientFeatureVisibilityData } from '../types/clientFeatureVisibility.types';
import type { ApiError } from '@/lib/request';

export function useClientFeatureVisibility(clientId: string) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<ClientFeatureVisibilityResponse, ApiError>(
    clientId ? buildClientFeatureVisibilityUrl(clientId) : null,
    () => getClientFeatureVisibility(clientId),
  );

  const { mutate: globalMutate } = useSWRConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ApiError | null>(null);

  const submit = async (payload: ClientFeatureVisibilityData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await updateClientFeatureVisibility(clientId, payload);
      await globalMutate(buildClientFeatureVisibilityUrl(clientId));
      // also refresh client self visibility cache key if present
      try {
        await globalMutate('/api/client/feature-visibility');
      } catch {}
      return result;
    } catch (err) {
      const apiError = err as ApiError;
      setSubmitError(apiError);
      throw apiError;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    data,
    error,
    isLoading,
    isValidating,
    isSubmitting,
    submitError,
    refresh: mutate,
    submit,
  };
}
