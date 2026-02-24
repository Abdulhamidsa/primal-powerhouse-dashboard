'use client';

import useSWR, { useSWRConfig } from 'swr';
import {
  deleteAdminClientWeeklyCheckIn,
  getAdminClientWeeklyCheckIns,
  getAdminClientWeeklyCheckInStatuses,
  resetAdminClientWeeklyCheckIns,
} from '@/features/weekly-checkin/api/adminWeeklyCheckIn.api';
import type {
  AdminClientWeeklyCheckInsResponse,
  AdminWeeklyCheckInStatusEntry,
} from '@/features/weekly-checkin/types/adminWeeklyCheckIn.types';
import type { ApiError } from '@/lib/fetcher';

function buildAdminClientWeeklyCheckInsKey(clientId: string): string {
  return `/api/admin/clients/${encodeURIComponent(clientId)}/weekly-checkins`;
}

function buildAdminWeeklyCheckInStatusesKey(clientIds: string[]): string {
  return `/api/admin/clients/weekly-checkins/statuses?clientIds=${clientIds.join(',')}`;
}

export function useAdminClientWeeklyCheckIns(clientId: string) {
  const key = clientId ? buildAdminClientWeeklyCheckInsKey(clientId) : null;

  const { data, error, isLoading, mutate, isValidating } = useSWR<AdminClientWeeklyCheckInsResponse, ApiError>(
    key,
    () => getAdminClientWeeklyCheckIns(clientId)
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useAdminWeeklyCheckInStatuses(clientIds: string[]) {
  const normalizedIds = clientIds.filter(Boolean);
  const key = normalizedIds.length ? buildAdminWeeklyCheckInStatusesKey(normalizedIds) : null;

  const { data, error, isLoading, mutate } = useSWR<Record<string, AdminWeeklyCheckInStatusEntry>, ApiError>(
    key,
    async () => {
      const response = await getAdminClientWeeklyCheckInStatuses(normalizedIds);
      return response.statuses;
    }
  );

  return {
    statuses: data ?? {},
    error,
    isLoading,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useAdminWeeklyCheckInActions(clientId: string) {
  const { mutate } = useSWRConfig();

  const refreshRelated = async () => {
    await mutate(buildAdminClientWeeklyCheckInsKey(clientId));
    await mutate((key: string) => key.startsWith('/api/admin/clients/weekly-checkins/statuses?clientIds='));
  };

  const deleteCheckIn = async (checkInId: string) => {
    await deleteAdminClientWeeklyCheckIn(clientId, checkInId);
    await refreshRelated();
  };

  const resetAll = async () => {
    const result = await resetAdminClientWeeklyCheckIns(clientId, 'RESET');
    await refreshRelated();
    return result;
  };

  return {
    deleteCheckIn,
    resetAll,
  };
}
