'use client';

import useSWR, { useSWRConfig } from 'swr';
import { useState } from 'react';
import type { ApiError } from '@/lib/request';
import {
  getUserProfile,
  sendUserPasswordLink,
  USER_PROFILE_ME_URL,
  logoutUser,
  addRecoveryEmail,
  updateDisplayName,
} from '@/features/user-profile/api/userProfile.api';
import type { PasswordLinkResponse, RecoveryEmailResponse, UserProfileResponse } from '@/features/user-profile/types/userProfile.types';
import { OFFLINE_METADATA_KEY } from '@/features/offline/lib/offlinePolicy';
import { USER_DASHBOARD_SUMMARY_URL } from '@/features/user-dashboard/api/userDashboard.api';
import { THEME_STORAGE_KEY } from '@/features/theme-preference/api/themePreference.api';

const USER_DATA_URL = '/api/user/data';

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
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(`${THEME_STORAGE_KEY}:`)) localStorage.removeItem(key);
    }
    document.cookie = 'pph_theme_preference=; Path=/; Max-Age=0; SameSite=Lax';
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

export function useRecoveryEmail() {
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RecoveryEmailResponse | null>(null);

  async function save(email: string) {
    setLoading(true);
    setError('');
    try {
      const response = await addRecoveryEmail(email);
      setResult(response);
      await mutate(USER_PROFILE_ME_URL);
      return response;
    } catch (err) {
      const message = err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Something went wrong';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { save, loading, error, result };
}

export function useDisplayNameUpdate() {
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<UserProfileResponse | null>(null);

  async function save(name: string) {
    setLoading(true);
    setError('');
    try {
      const response = await updateDisplayName(name);
      setResult(response);
      await mutate(USER_PROFILE_ME_URL, response, false);
      await mutate(
        USER_DASHBOARD_SUMMARY_URL,
        current => current ? { ...current, user: { ...current.user, name: response.user.displayName } } : current,
        false,
      );
      await mutate(
        USER_DATA_URL,
        current => current ? { ...current, name: response.user.displayName } : current,
        false,
      );
      void Promise.all([
        mutate(USER_PROFILE_ME_URL),
        mutate(USER_DASHBOARD_SUMMARY_URL),
        mutate(USER_DATA_URL),
      ]);
      return response;
    } catch (err) {
      const message = err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Something went wrong';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { save, loading, error, result };
}
