'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import type { ApiError } from '@/lib/fetcher';
import { buildClientLeadsUrl, getClientLeads } from '@/features/client-leads/api/clientLead.api';
import type { ClientLead } from '@/features/client-leads/types/clientLead.types';

export function useClientLeads() {
  const [search, setSearch] = useState('');

  const { data, error, isLoading, isValidating, mutate } = useSWR<ClientLead[], ApiError>(
    buildClientLeadsUrl(),
    getClientLeads,
  );

  const leads = useMemo(() => data ?? [], [data]);

  const filteredLeads = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return leads;
    return leads.filter(
      l =>
        l.name.toLowerCase().includes(normalized) ||
        l.email.toLowerCase().includes(normalized) ||
        (l.phone ?? '').toLowerCase().includes(normalized),
    );
  }, [leads, search]);

  return {
    leads,
    filteredLeads,
    search,
    setSearch,
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
  };
}
