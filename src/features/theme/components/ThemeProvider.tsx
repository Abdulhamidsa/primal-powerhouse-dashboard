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
const ADMIN_APPEARANCE_STORAGE_KEY = 'pph_admin_appearance_v1';

export type ThemeScope = 'root' | 'admin';

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

function getCachedAppearance(storageKey = APPEARANCE_STORAGE_KEY, includeLegacy = true): AppearanceSelection | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(storageKey);
  if (raw) {
    try {
      const value = JSON.parse(raw) as Partial<AppearanceSelection>;
      if (typeof value === 'object' && value) return { mode: normalizeMode(value.mode), accentTheme: normalizeAccentTheme(value.accentTheme) };
    } catch { /* Fall through to the accent-only migration path. */ }
  }
  if (!includeLegacy) return null;
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

function cacheAppearance(selection: AppearanceSelection, storageKey = APPEARANCE_STORAGE_KEY, writeCookies = true): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(selection));
  if (writeCookies) {
    document.cookie = `${MODE_COOKIE_NAME}=${selection.mode}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.cookie = `${ACCENT_COOKIE_NAME}=${selection.accentTheme}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
}

export function ThemeProvider({
  children,
  initialAppearance,
  scope = 'root',
  storageKey,
}: {
  children: React.ReactNode;
  initialAppearance?: Partial<AppearanceSelection> | null;
  scope?: ThemeScope;
  storageKey?: string;
}) {
  const isScoped = scope === 'admin';
  const resolvedStorageKey = storageKey ?? (isScoped ? ADMIN_APPEARANCE_STORAGE_KEY : APPEARANCE_STORAGE_KEY);
  const eventName = isScoped ? `${APPEARANCE_EVENT_NAME}:admin` : APPEARANCE_EVENT_NAME;
  const initialSelection = {
    mode: normalizeMode(initialAppearance?.mode),
    accentTheme: normalizeAccentTheme(initialAppearance?.accentTheme),
  };
  const [appearance, setAppearanceState] = useState<AppearanceSelection>(() => initialAppearance ? initialSelection : getCachedAppearance(resolvedStorageKey, !isScoped) ?? initialSelection);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!initialAppearance) {
      const cached = getCachedAppearance(resolvedStorageKey, !isScoped);
      if (cached && (cached.mode !== appearance.mode || cached.accentTheme !== appearance.accentTheme)) {
        setAppearanceState(cached);
        return;
      }
    }
    if (!isScoped) applyAppearance(appearance);
    setReady(true);
  }, [appearance, initialAppearance, isScoped, resolvedStorageKey]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== resolvedStorageKey) return;
      setAppearanceState(getCachedAppearance(resolvedStorageKey, !isScoped) ?? { mode: DEFAULT_APPEARANCE_MODE, accentTheme: DEFAULT_ACCENT_THEME_ID });
    };
    const handleAppearanceEvent = (event: Event) => {
      const detail = (event as CustomEvent<Partial<AppearanceSelection>>).detail;
      setAppearanceState({ mode: normalizeMode(detail?.mode), accentTheme: normalizeAccentTheme(detail?.accentTheme) });
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(eventName, handleAppearanceEvent);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(eventName, handleAppearanceEvent);
    };
  }, [eventName, isScoped, resolvedStorageKey]);

  const setAppearance = useCallback((next: AppearanceSelection) => {
    const resolved = { mode: normalizeMode(next.mode), accentTheme: normalizeAccentTheme(next.accentTheme) };
    setAppearanceState(resolved);
    if (!isScoped) applyAppearance(resolved);
    cacheAppearance(resolved, resolvedStorageKey, !isScoped);
    window.dispatchEvent(new CustomEvent(eventName, { detail: resolved }));
  }, [eventName, isScoped, resolvedStorageKey]);
  const setMode = useCallback((mode: AppearanceMode) => setAppearance({ ...appearance, mode }), [appearance, setAppearance]);
  const setAccentTheme = useCallback((accentTheme: AccentThemeId) => setAppearance({ ...appearance, accentTheme }), [appearance, setAppearance]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode: appearance.mode, accentTheme: appearance.accentTheme, themeId: appearance.accentTheme, tokens: composeTheme(appearance.mode, appearance.accentTheme), appearanceOptions: { modes: appearanceModeOptions, accents: themeOptions }, themeOptions, setMode, setAccentTheme, setAppearance, setTheme: setAccentTheme, ready }),
    [appearance, ready, setAccentTheme, setAppearance, setMode],
  );

  const content = <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
  if (!isScoped) return content;

  return (
    <div
      data-theme-scope="admin"
      data-mode={appearance.mode}
      data-accent={appearance.accentTheme}
      data-theme={appearance.accentTheme}
      className={appearance.mode === 'dark' ? 'contents dark' : 'contents'}
    >
      {content}
    </div>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}

export { APPEARANCE_STORAGE_KEY, LEGACY_THEME_STORAGE_KEY, MODE_COOKIE_NAME, ACCENT_COOKIE_NAME, ADMIN_APPEARANCE_STORAGE_KEY, applyAppearance, cacheAppearance, normalizeAccentTheme, normalizeMode };
