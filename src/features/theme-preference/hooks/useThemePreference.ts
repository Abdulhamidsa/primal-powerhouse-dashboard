'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  applyThemePreference,
  emitThemePreferenceChanged,
  getStoredThemePreference,
  normalizeThemePreference,
  setStoredThemePreference,
  subscribeThemePreferenceChanged,
} from '@/features/theme-preference/api/themePreference.api';
import { THEME_OPTIONS, type ThemePreference } from '@/features/theme-preference/types/themePreference.types';

type UseThemePreferenceOptions = {
  enabled?: boolean;
};

export function useThemePreference(options: UseThemePreferenceOptions = {}) {
  const { enabled = true } = options;
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('ember');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const resolved = normalizeThemePreference(getStoredThemePreference());
    setThemePreferenceState(resolved);
    applyThemePreference(resolved);
    setIsHydrated(true);

    return subscribeThemePreferenceChanged(nextTheme => {
      setThemePreferenceState(nextTheme);
      applyThemePreference(nextTheme);
    });
  }, [enabled]);

  const setThemePreference = useCallback((theme: ThemePreference) => {
    const resolved = normalizeThemePreference(theme);
    setThemePreferenceState(resolved);
    setStoredThemePreference(resolved);
    applyThemePreference(resolved);
    emitThemePreferenceChanged(resolved);
  }, []);

  const themeOptions = useMemo(() => THEME_OPTIONS, []);

  return {
    themePreference,
    setThemePreference,
    themeOptions,
    isHydrated,
  };
}
