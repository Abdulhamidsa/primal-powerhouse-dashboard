'use client';

import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import {
  buildAdminCoachingInterestUrl,
  getAdminCoachingInterests,
  updateAdminCoachingInterest,
} from '@/features/coaching-interest/api/coachingInterest.api';
import type { AdminCoachingInterestStatus } from '@/features/coaching-interest/types/coachingInterest.types';
import type { ApiError } from '@/lib/request';

const REQUEST_REFRESH_INTERVAL_MS = 8_000;

export function useAdminCoachingInterests(status: AdminCoachingInterestStatus) {
  const { mutate: globalMutate } = useSWRConfig();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const { data, error, isLoading } = useSWR(
    buildAdminCoachingInterestUrl(status),
    () => getAdminCoachingInterests(status),
    { refreshInterval: REQUEST_REFRESH_INTERVAL_MS, revalidateOnFocus: true, revalidateOnReconnect: true },
  );

  const setContacted = async (messageId: string, contacted: boolean) => {
    if (updatingId) return;
    setUpdatingId(messageId);
    setUpdateError(null);
    try {
      await updateAdminCoachingInterest(messageId, contacted);
      await Promise.all(
        (['pending', 'contacted', 'all'] as const).map(nextStatus =>
          globalMutate(buildAdminCoachingInterestUrl(nextStatus)),
        ),
      );
    } catch (requestError) {
      setUpdateError(
        requestError && typeof requestError === 'object' && 'message' in requestError
          ? String(requestError.message)
          : 'Could not update this request. Please try again.',
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return {
    items: data?.items ?? [],
    pendingCount: data?.pendingCount ?? 0,
    isLoading,
    error: error as ApiError | undefined,
    updatingId,
    updateError,
    setContacted,
  };
}
