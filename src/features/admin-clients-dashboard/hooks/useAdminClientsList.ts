'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import useSWR from 'swr';
import type { ApiError } from '@/lib/fetcher';
import { httpClient } from '@/lib/http/client';
import { buildClientsListUrl } from '@/features/admin-clients-dashboard/api/adminClientsDashboard.api';
import type { AdminClientListItem } from '@/features/admin-clients-dashboard/types/adminClientsDashboard.types';

export function useAdminClientsList() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const deferredSearch = useDeferredValue(search);

  const { data, error, isLoading, isValidating, mutate } = useSWR<AdminClientListItem[], ApiError>(
    buildClientsListUrl(viewMode === 'archived'),
    (url: string) => httpClient.get<AdminClientListItem[]>(url),
  );

  const clients = useMemo(() => data ?? [], [data]);

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
    setViewMode,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}
