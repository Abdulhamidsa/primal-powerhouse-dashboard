import { accentThemeIds, composeTheme, type AccentThemeId, type AppearanceMode, type ThemeTokens } from '@primal/theme';
import { useEffect, useSyncExternalStore } from 'react';
import { getAppearance, restoreAppearance, selectAppearance, subscribeAppearance } from '../api/theme.api';

export function useTheme(userId?: string | null) {
  const appearance = useSyncExternalStore(subscribeAppearance, getAppearance, getAppearance);
  const tokens: ThemeTokens = composeTheme(appearance.mode, appearance.accentTheme);

  return {
    name: appearance.accentTheme,
    themeId: appearance.accentTheme,
    mode: appearance.mode,
    accentTheme: appearance.accentTheme,
    tokens,
    colors: tokens,
    options: accentThemeIds,
    setMode: (mode: AppearanceMode) => selectAppearance({ mode }, userId),
    setAccentTheme: (accentTheme: AccentThemeId) => selectAppearance({ accentTheme }, userId),
    select: (nextTheme: AccentThemeId) => selectAppearance({ accentTheme: nextTheme }, userId),
  };
}

export function useRestoreTheme(userId?: string | null, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    void restoreAppearance(userId);
  }, [enabled, userId]);
}

export type { AccentThemeId as ThemeId };
