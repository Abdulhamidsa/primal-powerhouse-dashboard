import { themeIdSchema } from '@primal/theme';
import type { ThemePreference } from '@/features/theme-preference/types/themePreference.types';

export const THEME_STORAGE_KEY = 'pph_user_theme_preference';

export function getThemeStorageKey(userId?: string): string {
  return userId ? `${THEME_STORAGE_KEY}:${userId}` : THEME_STORAGE_KEY;
}

export function getStoredThemePreference(userId?: string): ThemePreference | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(getThemeStorageKey(userId));
  if (!raw) return null;

  const parsed = themeIdSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function setStoredThemePreference(theme: ThemePreference, userId?: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getThemeStorageKey(userId), theme);
}

export function normalizeThemePreference(theme: unknown): ThemePreference {
  const parsed = themeIdSchema.safeParse(theme);
  return parsed.success ? parsed.data : 'ember';
}
