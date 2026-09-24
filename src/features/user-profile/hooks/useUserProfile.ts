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
import { OFFLINE_METADATA_KEY } from '@/features/offline/lib/offlinePolicy';

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
    try {
      await logoutUser();
    } catch (error) {
      // The server session cannot be revoked without a connection, but the
      // installed app must still remove its private offline snapshot.
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 'OFFLINE')) throw error;
    }
    await mutate(USER_PROFILE_ME_URL, null, false);
    localStorage.removeItem('userType');
    localStorage.removeItem(OFFLINE_METADATA_KEY);
    navigator.serviceWorker?.controller?.postMessage({ type: 'OFFLINE_CLEAR_USER' });
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
