'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_ACCENT_THEME_ID,
  DEFAULT_APPEARANCE_MODE,
  accentThemeIds,
  appearanceModeIds,
  appearanceModeOptions,
  composeTheme,
  themeOptions,
  type AccentThemeId,
  type AppearanceMode,
  type AppearanceSelection,
  type ThemeTokens,
} from '@primal/theme';

const APPEARANCE_STORAGE_KEY = 'pph_appearance_v1';
const LEGACY_THEME_STORAGE_KEY = 'pph_theme_preference';
const MODE_COOKIE_NAME = 'pph_appearance_mode';
const ACCENT_COOKIE_NAME = 'pph_appearance_accent';
const APPEARANCE_EVENT_NAME = 'pph:appearance-changed';

type ThemeContextValue = {
  mode: AppearanceMode;
  accentTheme: AccentThemeId;
  /** @deprecated Use accentTheme. */
  themeId: AccentThemeId;
  tokens: ThemeTokens;
  appearanceOptions: { modes: typeof appearanceModeOptions; accents: typeof themeOptions };
  themeOptions: typeof themeOptions;
  setMode: (mode: AppearanceMode) => void;
  setAccentTheme: (accentTheme: AccentThemeId) => void;
  setAppearance: (selection: AppearanceSelection) => void;
  /** @deprecated Use setAccentTheme. */
  setTheme: (themeId: AccentThemeId) => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function normalizeMode(value: unknown): AppearanceMode {
  return typeof value === 'string' && appearanceModeIds.includes(value as AppearanceMode) ? value as AppearanceMode : DEFAULT_APPEARANCE_MODE;
}

function normalizeAccentTheme(value: unknown): AccentThemeId {
  return typeof value === 'string' && accentThemeIds.includes(value as AccentThemeId) ? value as AccentThemeId : DEFAULT_ACCENT_THEME_ID;
}

function getCachedAppearance(): AppearanceSelection | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
  if (raw) {
    try {
      const value = JSON.parse(raw) as Partial<AppearanceSelection>;
      if (typeof value === 'object' && value) return { mode: normalizeMode(value.mode), accentTheme: normalizeAccentTheme(value.accentTheme) };
    } catch { /* Fall through to the accent-only migration path. */ }
  }
  const legacyAccent = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  return legacyAccent ? { mode: DEFAULT_APPEARANCE_MODE, accentTheme: normalizeAccentTheme(legacyAccent) } : null;
}

function applyAppearance(selection: AppearanceSelection): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.mode = selection.mode;
  document.documentElement.dataset.accent = selection.accentTheme;
  document.documentElement.dataset.theme = selection.accentTheme;
  document.documentElement.classList.toggle('dark', selection.mode === 'dark');
}

function cacheAppearance(selection: AppearanceSelection): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(selection));
  document.cookie = `${MODE_COOKIE_NAME}=${selection.mode}; Path=/; Max-Age=31536000; SameSite=Lax`;
  document.cookie = `${ACCENT_COOKIE_NAME}=${selection.accentTheme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function ThemeProvider({
  children,
  initialAppearance,
}: {
  children: React.ReactNode;
  initialAppearance?: Partial<AppearanceSelection> | null;
}) {
  const initialSelection = {
    mode: normalizeMode(initialAppearance?.mode),
    accentTheme: normalizeAccentTheme(initialAppearance?.accentTheme),
  };
  const [appearance, setAppearanceState] = useState<AppearanceSelection>(() => initialAppearance ? initialSelection : getCachedAppearance() ?? initialSelection);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!initialAppearance) {
      const cached = getCachedAppearance();
      if (cached && (cached.mode !== appearance.mode || cached.accentTheme !== appearance.accentTheme)) {
        setAppearanceState(cached);
        return;
      }
    }
    applyAppearance(appearance);
    setReady(true);
  }, [appearance, initialAppearance]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== APPEARANCE_STORAGE_KEY) return;
      setAppearanceState(getCachedAppearance() ?? { mode: DEFAULT_APPEARANCE_MODE, accentTheme: DEFAULT_ACCENT_THEME_ID });
    };
    const handleAppearanceEvent = (event: Event) => {
      const detail = (event as CustomEvent<Partial<AppearanceSelection>>).detail;
      setAppearanceState({ mode: normalizeMode(detail?.mode), accentTheme: normalizeAccentTheme(detail?.accentTheme) });
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(APPEARANCE_EVENT_NAME, handleAppearanceEvent);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(APPEARANCE_EVENT_NAME, handleAppearanceEvent);
    };
  }, []);

  const setAppearance = useCallback((next: AppearanceSelection) => {
    const resolved = { mode: normalizeMode(next.mode), accentTheme: normalizeAccentTheme(next.accentTheme) };
    setAppearanceState(resolved);
    applyAppearance(resolved);
    cacheAppearance(resolved);
    window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT_NAME, { detail: resolved }));
  }, []);
  const setMode = useCallback((mode: AppearanceMode) => setAppearance({ ...appearance, mode }), [appearance, setAppearance]);
  const setAccentTheme = useCallback((accentTheme: AccentThemeId) => setAppearance({ ...appearance, accentTheme }), [appearance, setAppearance]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode: appearance.mode, accentTheme: appearance.accentTheme, themeId: appearance.accentTheme, tokens: composeTheme(appearance.mode, appearance.accentTheme), appearanceOptions: { modes: appearanceModeOptions, accents: themeOptions }, themeOptions, setMode, setAccentTheme, setAppearance, setTheme: setAccentTheme, ready }),
    [appearance, ready, setAccentTheme, setAppearance, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}

export { APPEARANCE_STORAGE_KEY, LEGACY_THEME_STORAGE_KEY, MODE_COOKIE_NAME, ACCENT_COOKIE_NAME, applyAppearance, cacheAppearance, normalizeAccentTheme, normalizeMode };
