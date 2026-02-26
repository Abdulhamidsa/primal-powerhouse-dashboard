'use client';

import useSWR, { useSWRConfig } from 'swr';
import type { ApiError } from '@/lib/request';
import {
  getPrivacyCenter,
  requestPrivacyDeletion,
  requestPrivacyExport,
  revokeAllSessions,
  updatePrivacyConsent,
} from '@/features/privacy/api/privacy.api';
import type { PrivacyConsentValues, PrivacyDeleteValues } from '@/features/privacy/types/privacy.types';

const PRIVACY_CENTER_KEY = '/api/privacy/center';

export function usePrivacyCenter() {
  const { data, error, isLoading, isValidating } = useSWR(PRIVACY_CENTER_KEY, getPrivacyCenter);
  return {
    data,
    error: error as ApiError | undefined,
    isLoading,
    isValidating,
  };
}

export function usePrivacyActions() {
  const { mutate } = useSWRConfig();

  const refresh = async () => {
    await mutate(PRIVACY_CENTER_KEY);
  };

  const updateConsent = async (payload: PrivacyConsentValues) => {
    const result = await updatePrivacyConsent(payload);
    await refresh();
    return result;
  };

  const startExport = async () => {
    const result = await requestPrivacyExport();
    await refresh();
    return result;
  };

  const requestDeletion = async (payload: PrivacyDeleteValues) => {
    const result = await requestPrivacyDeletion(payload);
    await refresh();
    return result;
  };

  const logoutAll = async () => {
    const result = await revokeAllSessions();
    await refresh();
    return result;
  };

  return {
    updateConsent,
    startExport,
    requestDeletion,
    logoutAll,
  };
}
