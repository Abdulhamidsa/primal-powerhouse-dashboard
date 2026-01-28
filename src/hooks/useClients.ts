import useSWR from 'swr';
import { DataService, Client } from '@/services/dataService';
import type { ApiError } from '@/lib/fetcher';

export function useClients() {
  const key = '/api/clients';

  const { data, error, isLoading, mutate, isValidating } = useSWR<Client[], ApiError>(
    key,
    async () => {
      const clientsData = await DataService.getClients();
      return clientsData;
    },
    { revalidateOnFocus: false }
  );

  return {
    clients: data || [],
    error,
    isLoading,
    isValidating,
    refresh: () => mutate(undefined, { revalidate: true }),
    mutate,
  };
}
