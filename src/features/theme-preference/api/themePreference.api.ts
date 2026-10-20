import { accentThemeIdSchema, appearanceModeSchema, type AppearanceSelection } from '@primal/theme';

export const THEME_STORAGE_KEY = 'pph_user_theme_preference';
export const APPEARANCE_STORAGE_KEY = 'pph_user_appearance_v1';
export const ADMIN_THEME_STORAGE_KEY = 'pph_admin_theme_preference';
export const ADMIN_APPEARANCE_STORAGE_KEY = 'pph_admin_appearance_v1';

export type ThemePreferenceScope = 'user' | 'admin';

export function getThemeStorageKey(userId?: string, scope: ThemePreferenceScope = 'user'): string {
  const baseKey = scope === 'admin' ? ADMIN_THEME_STORAGE_KEY : THEME_STORAGE_KEY;
  return userId ? `${baseKey}:${userId}` : baseKey;
}

export function getAppearanceStorageKey(userId?: string, scope: ThemePreferenceScope = 'user'): string {
  const baseKey = scope === 'admin' ? ADMIN_APPEARANCE_STORAGE_KEY : APPEARANCE_STORAGE_KEY;
  return userId ? `${baseKey}:${userId}` : baseKey;
}

export function normalizeAppearance(value: unknown): AppearanceSelection | null {
  if (!value || typeof value !== 'object') return null;
  const selection = value as Partial<AppearanceSelection>;
  const accentTheme = accentThemeIdSchema.safeParse(selection.accentTheme);
  if (!accentTheme.success) return null;
  const mode = appearanceModeSchema.safeParse(selection.mode);
  return { mode: mode.success ? mode.data : 'dark', accentTheme: accentTheme.data };
}

export function getStoredAppearance(userId?: string, scope: ThemePreferenceScope = 'user'): AppearanceSelection | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(getAppearanceStorageKey(userId, scope));
  if (raw) {
    try {
      const selection = normalizeAppearance(JSON.parse(raw));
      if (selection) return selection;
    } catch { /* Migrate the old accent-only cache below. */ }
  }
  const legacyAccent = accentThemeIdSchema.safeParse(window.localStorage.getItem(getThemeStorageKey(userId, scope)));
  return legacyAccent.success ? { mode: 'dark', accentTheme: legacyAccent.data } : null;
}

export function setStoredAppearance(appearance: AppearanceSelection, userId?: string, scope: ThemePreferenceScope = 'user'): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getAppearanceStorageKey(userId, scope), JSON.stringify(appearance));
}

export function normalizeThemePreference(theme: unknown) {
  const parsed = accentThemeIdSchema.safeParse(theme);
  return parsed.success ? parsed.data : 'ember';
}
