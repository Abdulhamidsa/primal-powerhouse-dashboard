import { themes, themeIds, type ThemeId, type ThemeTokens } from '@primal/theme';
import { useEffect, useSyncExternalStore } from 'react';
import { getTheme, restoreTheme, selectTheme, subscribeTheme } from '../api/theme.api';

export function useTheme(userId?: string | null) {
  const themeId = useSyncExternalStore(subscribeTheme, getTheme, getTheme);
  const tokens: ThemeTokens = themes[themeId];

  return {
    name: themeId,
    themeId,
    tokens,
    colors: tokens,
    options: themeIds,
    select: (nextTheme: string) => selectTheme(nextTheme, userId),
  };
}

export function useRestoreTheme(userId?: string | null, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    void restoreTheme(userId);
  }, [enabled, userId]);
}

export type { ThemeId };
