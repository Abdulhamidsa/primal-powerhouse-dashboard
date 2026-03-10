'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import type { ApiError } from '@/lib/fetcher';
import {
  buildClientsListUrl,
  getAdminClientsList,
} from '@/features/admin-clients-dashboard/api/adminClientsDashboard.api';
import type { AdminClientListItem } from '@/features/admin-clients-dashboard/types/adminClientsDashboard.types';

export function useAdminClientsList() {
  const [search, setSearch] = useState('');

  const { data, error, isLoading, isValidating, mutate } = useSWR<AdminClientListItem[], ApiError>(
    buildClientsListUrl(),
    getAdminClientsList
  );

  const clients = data ?? [];

  const filteredClients = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return clients;

    return clients.filter(client => {
      return client.name.toLowerCase().includes(normalized) || client.email.toLowerCase().includes(normalized);
    });
  }, [clients, search]);

  return {
    clients,
    filteredClients,
    search,
    setSearch,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}
