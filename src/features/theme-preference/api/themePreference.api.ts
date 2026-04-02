import { themePreferenceSchema } from '@/features/theme-preference/schemas/themePreference.schema';
import type { ThemePreference } from '@/features/theme-preference/types/themePreference.types';

export const THEME_STORAGE_KEY = 'pph_user_theme_preference';
const THEME_EVENT_NAME = 'pph:theme-preference-changed';

export function getStoredThemePreference(): ThemePreference | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (!raw) return null;

  const parsed = themePreferenceSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function setStoredThemePreference(theme: ThemePreference): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function applyThemePreference(theme: ThemePreference): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

export function normalizeThemePreference(theme: unknown): ThemePreference {
  const parsed = themePreferenceSchema.safeParse(theme);
  return parsed.success ? parsed.data : 'ember';
}

export function emitThemePreferenceChanged(theme: ThemePreference): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(THEME_EVENT_NAME, { detail: { theme } }));
}

export function subscribeThemePreferenceChanged(onTheme: (theme: ThemePreference) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    onTheme(normalizeThemePreference(event.newValue));
  };

  const handleThemeEvent = (event: Event) => {
    const customEvent = event as CustomEvent<{ theme?: unknown }>;
    onTheme(normalizeThemePreference(customEvent.detail?.theme));
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(THEME_EVENT_NAME, handleThemeEvent);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(THEME_EVENT_NAME, handleThemeEvent);
  };
}
