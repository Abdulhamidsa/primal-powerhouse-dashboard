'use client';

import useSWR from 'swr';
import type { ApiError } from '@/lib/fetcher';
import { getVideoCoachOptions, VIDEO_COACHES_URL } from '@/features/videos/api/video.api';
import type { VideoCoachOption } from '@/features/videos/types/video.types';

export function useVideoCoaches(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<{ coaches: VideoCoachOption[] }, ApiError>(
    enabled ? VIDEO_COACHES_URL : null,
    getVideoCoachOptions,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 60_000,
    },
  );

  return {
    coaches: data?.coaches ?? [],
    error,
    isLoading,
    refresh: mutate,
  };
}
