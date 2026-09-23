'use client';

import useSWR, { useSWRConfig } from 'swr';
import { useState } from 'react';
import type { ApiError } from '@/lib/request';
import {
  getUserProfile,
  sendUserPasswordLink,
  USER_PROFILE_ME_URL,
  logoutUser,
} from '@/features/user-profile/api/userProfile.api';
import type { PasswordLinkResponse, UserProfileResponse } from '@/features/user-profile/types/userProfile.types';

export function useUserProfile(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const { data, error, isLoading, isValidating, mutate } = useSWR<UserProfileResponse, ApiError>(
    enabled ? USER_PROFILE_ME_URL : null,
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

export function useUserPasswordLink() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PasswordLinkResponse | null>(null);

  async function sendPasswordLink() {
    setLoading(true);
    setError('');
    try {
      const response = await sendUserPasswordLink();
      setResult(response);
      return response;
    } catch (err) {
      const message = err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Something went wrong';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { sendPasswordLink, loading, error, result };
}
