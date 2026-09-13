import { useEffect, useRef, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getAuthState } from '@/features/auth/api/sessionStore';
import { shouldRefreshResource } from '../api/cachePolicy';

export function useResource<T>(path: string | null, loader: () => Promise<T>, persist = true) {
  const { session } = useAuth();
  const [cached, setCached] = useState<{ key: string; data: T; at: string } | null>(null);
  const key = session && path ? `primal:${session.user.id}:resource:${path}` : null;
  const swr = useSWR<T>(
    key,
    async () => {
      const data = await loader();
      if (persist && key && getAuthState().session?.user.id === session?.user.id)
        await AsyncStorage.setItem(key, JSON.stringify({ key, data, at: new Date().toISOString() })).catch(() => {});
      return data;
    },
    { shouldRetryOnError: false, keepPreviousData: false },
  );
  useEffect(() => {
    let active = true;
    if (persist && key)
      void AsyncStorage.getItem(key)
        .then(raw => {
          if (active && raw) setCached(JSON.parse(raw));
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [key, persist]);
  const fallback = cached?.key === key ? cached : null;
  return {
    ...swr,
    data: swr.data ?? fallback?.data,
    isLoading: !swr.data && !fallback && swr.isLoading,
    cachedAt: swr.data ? null : fallback?.at,
    refresh: () => swr.mutate(),
  };
}
export function useAction(paths: readonly string[]) {
  const running = useRef(false);
  const { mutate } = useSWRConfig();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    if (running.current) return;
    running.current = true;
    setPending(true);
    setError('');
    setNotice('');
    try {
      const userId = getAuthState().session?.user.id;
      const result = await action();
      setNotice('Saved');
      if (userId && getAuthState().session?.user.id === userId)
        void mutate(key => shouldRefreshResource(key, userId, paths)).catch(() => {});
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save');
    } finally {
      running.current = false;
      setPending(false);
    }
  }
  return { run, pending, error, notice };
}
export function useDraft<T>(name: string, initial: T) {
  const { session } = useAuth();
  const key = `primal:${session?.user.id}:draft:${name}`;
  const [state, setState] = useState<{ key: string; value: T; ready: boolean }>({ key, value: initial, ready: false });
  const ready = state.key === key && state.ready;
  const value = state.key === key ? state.value : initial;
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(key)
      .then(raw => {
        if (active)
          setState(old =>
            old.key === key && old.ready ? old : { key, value: raw ? JSON.parse(raw) : initial, ready: true },
          );
      })
      .catch(() => {
        if (active) setState(old => (old.key === key && old.ready ? old : { key, value: initial, ready: true }));
      });
    return () => {
      active = false;
    };
  }, [key]);
  useEffect(() => {
    if (ready && session && getAuthState().session?.user.id === session.user.id)
      void AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
  }, [key, ready, value, session]);
  const setValue: React.Dispatch<React.SetStateAction<T>> = next =>
    setState(old => ({
      key,
      ready: true,
      value: typeof next === 'function' ? (next as (previous: T) => T)(old.key === key ? old.value : initial) : next,
    }));
  return { value, setValue, ready };
}
