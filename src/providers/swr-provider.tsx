'use client';

import { SWRConfig } from 'swr';
import { fetcher } from '@/lib/fetcher';

export function SwrProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        keepPreviousData: true,
        shouldRetryOnError: (err: any) => err?.status !== 401 && err?.status !== 403,
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  );
}
