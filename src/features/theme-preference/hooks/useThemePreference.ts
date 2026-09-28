'use client';

import { useCallback, useEffect, useState } from 'react';
import { getStoredAppearance, setStoredAppearance } from '@/features/theme-preference/api/themePreference.api';
import { getThemePreference, updateAppearancePreference } from '@/features/theme/api/theme.api';
import { useTheme } from '@/features/theme/components/ThemeProvider';

type UseThemePreferenceOptions = {
  enabled?: boolean;
  userId?: string | null;
};

export function useThemePreference(options: UseThemePreferenceOptions = {}) {
  const { enabled = true, userId } = options;
  const { mode, accentTheme, appearanceOptions, setAppearance, ready } = useTheme();
  const [isAccountReady, setIsAccountReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const cached = getStoredAppearance(userId ?? undefined);
    if (cached) {
      setAppearance(cached);
    }

    void getThemePreference()
      .then(response => {
        if (cancelled) return;
        setStoredAppearance({ mode: response.mode, accentTheme: response.accentTheme }, response.userId);
        setAppearance({ mode: response.mode, accentTheme: response.accentTheme });
        setIsAccountReady(true);
      })
      .catch(() => {
        if (!cancelled) setIsAccountReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, setAppearance, userId]);

  const persist = useCallback(async (next: { mode?: typeof mode; accentTheme?: typeof accentTheme }) => {
    const selection = { mode: next.mode ?? mode, accentTheme: next.accentTheme ?? accentTheme };
    setAppearance(selection);
    setStoredAppearance(selection, userId ?? undefined);
    try {
      const response = await updateAppearancePreference(next);
      setStoredAppearance({ mode: response.mode, accentTheme: response.accentTheme }, response.userId);
    } catch {
      // Keep the optimistic local theme; the next authenticated restore will reconcile it.
    }
  }, [accentTheme, mode, setAppearance, userId]);

  return {
    mode,
    accentTheme,
    setMode: (nextMode: typeof mode) => persist({ mode: nextMode }),
    setAccentTheme: (nextAccentTheme: typeof accentTheme) => persist({ accentTheme: nextAccentTheme }),
    appearanceOptions,
    isHydrated: ready && (!enabled || isAccountReady),
  };
}
