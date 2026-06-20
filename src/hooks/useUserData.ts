import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { ApiError } from '@/lib/fetcher';

export type UserData = {
  name: string;
  avatar?: string | null;
  motivationalMessage?: string;
  goalWeight?: number | null;
};

export function useUserData(enabled = true) {
  const key = '/api/user/data';

  const { data, error, isLoading, mutate, isValidating } = useSWR<UserData, ApiError>(
    enabled ? key : null,
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  );

  return {
    user: data,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}
