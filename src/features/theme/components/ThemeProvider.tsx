'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_THEME_ID, themeIds, themeOptions, themes, type ThemeId, type ThemeTokens } from '@primal/theme';

const ANONYMOUS_THEME_STORAGE_KEY = 'pph_theme_preference';
const THEME_COOKIE_NAME = 'pph_theme_preference';
const THEME_EVENT_NAME = 'pph:theme-preference-changed';

type ThemeContextValue = {
  themeId: ThemeId;
  tokens: ThemeTokens;
  themeOptions: typeof themeOptions;
  setTheme: (themeId: ThemeId) => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function normalizeTheme(value: unknown): ThemeId {
  return typeof value === 'string' && themeIds.includes(value as ThemeId) ? (value as ThemeId) : DEFAULT_THEME_ID;
}

function getCachedTheme(): ThemeId | null {
  if (typeof window === 'undefined') return null;
  return normalizeTheme(window.localStorage.getItem(ANONYMOUS_THEME_STORAGE_KEY));
}

function applyTheme(themeId: ThemeId): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', themeId);
}

function cacheTheme(themeId: ThemeId): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ANONYMOUS_THEME_STORAGE_KEY, themeId);
  document.cookie = `${THEME_COOKIE_NAME}=${themeId}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: ThemeId | null;
}) {
  const [themeId, setThemeId] = useState<ThemeId>(initialTheme ?? getCachedTheme() ?? DEFAULT_THEME_ID);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!initialTheme) {
      const cachedTheme = getCachedTheme();
      if (cachedTheme && cachedTheme !== themeId) setThemeId(cachedTheme);
    }
    applyTheme(themeId);
    setReady(true);
  }, [initialTheme, themeId]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== ANONYMOUS_THEME_STORAGE_KEY) return;
      setThemeId(normalizeTheme(event.newValue));
    };
    const handleThemeEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ theme?: unknown }>;
      setThemeId(normalizeTheme(customEvent.detail?.theme));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(THEME_EVENT_NAME, handleThemeEvent);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(THEME_EVENT_NAME, handleThemeEvent);
    };
  }, []);

  const setTheme = useCallback((nextTheme: ThemeId) => {
    const resolved = normalizeTheme(nextTheme);
    setThemeId(resolved);
    cacheTheme(resolved);
    window.dispatchEvent(new CustomEvent(THEME_EVENT_NAME, { detail: { theme: resolved } }));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ themeId, tokens: themes[themeId], themeOptions, setTheme, ready }),
    [ready, setTheme, themeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}

export { ANONYMOUS_THEME_STORAGE_KEY, THEME_COOKIE_NAME, applyTheme, cacheTheme, normalizeTheme };
