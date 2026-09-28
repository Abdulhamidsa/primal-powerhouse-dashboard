import { accentThemeIdSchema, appearanceModeSchema, type AppearanceSelection } from '@primal/theme';

export const THEME_STORAGE_KEY = 'pph_user_theme_preference';
export const APPEARANCE_STORAGE_KEY = 'pph_user_appearance_v1';

export function getThemeStorageKey(userId?: string): string {
  return userId ? `${THEME_STORAGE_KEY}:${userId}` : THEME_STORAGE_KEY;
}

export function getAppearanceStorageKey(userId?: string): string {
  return userId ? `${APPEARANCE_STORAGE_KEY}:${userId}` : APPEARANCE_STORAGE_KEY;
}

export function normalizeAppearance(value: unknown): AppearanceSelection | null {
  if (!value || typeof value !== 'object') return null;
  const selection = value as Partial<AppearanceSelection>;
  const accentTheme = accentThemeIdSchema.safeParse(selection.accentTheme);
  if (!accentTheme.success) return null;
  const mode = appearanceModeSchema.safeParse(selection.mode);
  return { mode: mode.success ? mode.data : 'dark', accentTheme: accentTheme.data };
}

export function getStoredAppearance(userId?: string): AppearanceSelection | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(getAppearanceStorageKey(userId));
  if (raw) {
    try {
      const selection = normalizeAppearance(JSON.parse(raw));
      if (selection) return selection;
    } catch { /* Migrate the old accent-only cache below. */ }
  }
  const legacyAccent = accentThemeIdSchema.safeParse(window.localStorage.getItem(getThemeStorageKey(userId)));
  return legacyAccent.success ? { mode: 'dark', accentTheme: legacyAccent.data } : null;
}

export function setStoredAppearance(appearance: AppearanceSelection, userId?: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getAppearanceStorageKey(userId), JSON.stringify(appearance));
}

export function normalizeThemePreference(theme: unknown) {
  const parsed = accentThemeIdSchema.safeParse(theme);
  return parsed.success ? parsed.data : 'ember';
}
