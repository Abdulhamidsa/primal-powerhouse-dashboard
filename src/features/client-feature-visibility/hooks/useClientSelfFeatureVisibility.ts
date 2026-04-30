import useSWR from 'swr';
import { httpClient } from '@/lib/http/client';
import { ClientFeatureVisibilityResponse } from '../types/clientFeatureVisibility.types';
import { ApiError } from '@/lib/http/types';

export function useClientSelfFeatureVisibility() {
  const { data, error, isLoading, isValidating } = useSWR<ClientFeatureVisibilityResponse, ApiError>(
    '/api/client/feature-visibility',
    (url: string) => httpClient.get<ClientFeatureVisibilityResponse>(url),
  );

  return {
    visibility: data,
    error,
    isLoading,
    isValidating,
  };
}
