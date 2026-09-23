'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import useSWR from 'swr';
import type { ApiError } from '@/lib/fetcher';
import { httpClient } from '@/lib/http/client';
import { buildClientsListUrl } from '@/features/admin-clients-dashboard/api/adminClientsDashboard.api';
import type { AdminClientListItem, AdminClientStatus, AdminClientsListResponse } from '@/features/admin-clients-dashboard/types/adminClientsDashboard.types';

export function useAdminClientsList() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<AdminClientStatus>('ACTIVE');
  const deferredSearch = useDeferredValue(search);

  const { data: response, error, isLoading, isValidating, mutate } = useSWR<AdminClientsListResponse, ApiError>(
    buildClientsListUrl(viewMode, true),
    (url: string) => httpClient.get<AdminClientsListResponse>(url),
  );

  const clients = useMemo(() => response?.clients ?? [], [response]);

  const filteredClients = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();
    if (!normalized) return clients;

    return clients.filter(client => {
      return client.name.toLowerCase().includes(normalized) || client.email.toLowerCase().includes(normalized);
    });
  }, [clients, deferredSearch]);

  return {
    clients,
    filteredClients,
    search,
    setSearch,
    viewMode,
    counts: response?.counts ?? { ACTIVE: 0, INACTIVE: 0, ARCHIVED: 0 },
    setViewMode,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}
