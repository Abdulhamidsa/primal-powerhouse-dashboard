import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { ApiError } from '@/lib/fetcher';

export type UserData = {
  name: string;
  avatar?: string | null;
  motivationalMessage?: string;
  goalWeight?: number | null;
};

export function useUserData() {
  const key = '/api/user/data';

  const { data, error, isLoading, mutate, isValidating } = useSWR<UserData, ApiError>(key, fetcher, {
    revalidateOnFocus: true,
  });

  return {
    user: data,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}
