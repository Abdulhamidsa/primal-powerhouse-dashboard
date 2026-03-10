'use client';

import useSWR from 'swr';
import { useSWRConfig } from 'swr';
import type { ApiError } from '@/lib/fetcher';
import type { VideoAssignment } from '@/types/video';
import {
  buildClientVideoAssignmentsUrl,
  deleteVideoAssignment,
  getClientVideoAssignments,
} from '@/features/admin-clients-dashboard/api/adminClientsDashboard.api';

export function useClientVideoAssignments(clientId: string | null) {
  const key = clientId ? buildClientVideoAssignmentsUrl(clientId) : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<VideoAssignment[], ApiError>(key, () =>
    getClientVideoAssignments(clientId as string)
  );

  return {
    assignments: data ?? [],
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}

export function useClientVideoAssignmentActions(clientId: string | null) {
  const { mutate } = useSWRConfig();

  const refreshAssignments = async () => {
    if (!clientId) return;
    await mutate(buildClientVideoAssignmentsUrl(clientId));
  };

  const removeAssignment = async (assignmentId: string) => {
    await deleteVideoAssignment(assignmentId);
    await refreshAssignments();
  };

  return { removeAssignment };
}
