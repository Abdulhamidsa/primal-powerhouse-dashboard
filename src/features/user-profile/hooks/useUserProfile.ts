'use client';

import useSWR, { useSWRConfig } from 'swr';
import type { ApiError } from '@/lib/request';
import { getUserProfile, USER_PROFILE_ME_URL, logoutUser } from '@/features/user-profile/api/userProfile.api';
import type { UserProfileResponse } from '@/features/user-profile/types/userProfile.types';

export function useUserProfile() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<UserProfileResponse, ApiError>(
    USER_PROFILE_ME_URL,
    getUserProfile,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  );

  return {
    user: data?.user ?? null,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useUserLogout() {
  const { mutate } = useSWRConfig();

  const logout = async () => {
    await logoutUser();
    await mutate(USER_PROFILE_ME_URL, null, false);
    localStorage.removeItem('userType');
  };

  return { logout };
}
