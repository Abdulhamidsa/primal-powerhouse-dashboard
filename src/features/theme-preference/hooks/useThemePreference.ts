'use client';

import { useCallback, useEffect, useState } from 'react';
import { getStoredAppearance, setStoredAppearance, type ThemePreferenceScope } from '@/features/theme-preference/api/themePreference.api';
import { getThemePreference, updateAppearancePreference } from '@/features/theme/api/theme.api';
import { useTheme } from '@/features/theme/components/ThemeProvider';

type UseThemePreferenceOptions = {
  enabled?: boolean;
  userId?: string | null;
  scope?: ThemePreferenceScope;
};

export function useThemePreference(options: UseThemePreferenceOptions = {}) {
  const { enabled = true, userId, scope = 'user' } = options;
  const { mode, accentTheme, appearanceOptions, setAppearance, ready } = useTheme();
  const [isAccountReady, setIsAccountReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const cached = getStoredAppearance(userId ?? undefined, scope);
    if (cached) {
      setAppearance(cached);
    }

    void getThemePreference(scope)
      .then(response => {
        if (cancelled) return;
        setStoredAppearance({ mode: response.mode, accentTheme: response.accentTheme }, response.userId, scope);
        setAppearance({ mode: response.mode, accentTheme: response.accentTheme });
        setIsAccountReady(true);
      })
      .catch(() => {
        if (!cancelled) setIsAccountReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, scope, setAppearance, userId]);

  const persist = useCallback(async (next: { mode?: typeof mode; accentTheme?: typeof accentTheme }) => {
    const selection = { mode: next.mode ?? mode, accentTheme: next.accentTheme ?? accentTheme };
    setAppearance(selection);
    setStoredAppearance(selection, userId ?? undefined, scope);
    try {
      const response = await updateAppearancePreference(next, scope);
      setStoredAppearance({ mode: response.mode, accentTheme: response.accentTheme }, response.userId, scope);
    } catch {
      // Keep the optimistic local theme; the next authenticated restore will reconcile it.
    }
  }, [accentTheme, mode, scope, setAppearance, userId]);

  return {
    mode,
    accentTheme,
    setMode: (nextMode: typeof mode) => persist({ mode: nextMode }),
    setAccentTheme: (nextAccentTheme: typeof accentTheme) => persist({ accentTheme: nextAccentTheme }),
    appearanceOptions,
    isHydrated: ready && (!enabled || isAccountReady),
  };
}
