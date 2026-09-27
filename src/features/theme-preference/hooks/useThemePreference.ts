'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getStoredThemePreference, normalizeThemePreference, setStoredThemePreference } from '@/features/theme-preference/api/themePreference.api';
import { THEME_OPTIONS, type ThemePreference } from '@/features/theme-preference/types/themePreference.types';
import { getThemePreference, updateThemePreference } from '@/features/theme/api/theme.api';
import { useTheme } from '@/features/theme/components/ThemeProvider';

type UseThemePreferenceOptions = {
  enabled?: boolean;
  userId?: string | null;
};

export function useThemePreference(options: UseThemePreferenceOptions = {}) {
  const { enabled = true, userId } = options;
  const { themeId, setTheme, ready } = useTheme();
  const [isAccountReady, setIsAccountReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const cached = getStoredThemePreference(userId ?? undefined);
    if (cached) setTheme(cached);

    void getThemePreference()
      .then(response => {
        if (cancelled) return;
        setStoredThemePreference(response.themePreference, response.userId);
        setTheme(response.themePreference);
        setIsAccountReady(true);
      })
      .catch(() => {
        if (!cancelled) setIsAccountReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, setTheme, userId]);

  const setThemePreference = useCallback(async (theme: ThemePreference) => {
    const resolved = normalizeThemePreference(theme);
    setTheme(resolved);
    setStoredThemePreference(resolved, userId ?? undefined);
    try {
      const response = await updateThemePreference(resolved);
      setStoredThemePreference(response.themePreference, response.userId);
    } catch {
      // Keep the optimistic local theme; the next authenticated restore will reconcile it.
    }
  }, [setTheme, userId]);

  const themeOptions = useMemo(() => THEME_OPTIONS, []);

  return {
    themePreference: themeId,
    setThemePreference,
    themeOptions,
    isHydrated: ready && (!enabled || isAccountReady),
  };
}
