import AsyncStorage from '@react-native-async-storage/async-storage';
import { themeIdSchema, themes, type ThemeId } from '@primal/theme';
import { httpClient } from '@/lib/http/client';

const LEGACY_THEME_STORAGE_KEY = 'primal:theme';
let current: ThemeId = 'ember';
const listeners = new Set<() => void>();

export const getTheme = () => current;
export const subscribeTheme = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function getThemeStorageKey(userId?: string | null): string {
  return userId ? `primal:${userId}:theme` : LEGACY_THEME_STORAGE_KEY;
}

function notify() {
  listeners.forEach(listener => listener());
}

function resolveTheme(name: unknown): ThemeId | null {
  const parsed = themeIdSchema.safeParse(name);
  return parsed.success ? parsed.data : null;
}

function setCurrent(name: ThemeId) {
  current = name;
  notify();
}

export async function selectTheme(name: string, userId?: string | null) {
  const resolved = resolveTheme(name);
  if (!resolved) return;

  setCurrent(resolved);
  await AsyncStorage.setItem(getThemeStorageKey(userId), resolved);

  if (userId) {
    try {
      await httpClient.send('/api/user/theme-preference', 'PUT', { themePreference: resolved });
    } catch {
      // Keep the local choice; the next restore will reconcile with the server.
    }
  }
}

export async function restoreTheme(userId?: string | null) {
  const saved = resolveTheme(await AsyncStorage.getItem(getThemeStorageKey(userId)));
  if (saved) setCurrent(saved);

  if (!userId) return;

  try {
    const response = await httpClient.get<{ themePreference: string }>('/api/user/theme-preference');
    const remote = resolveTheme(response.themePreference);
    if (!remote) return;
    setCurrent(remote);
    await AsyncStorage.setItem(getThemeStorageKey(userId), remote);
  } catch {
    // Offline startup continues with the cached theme.
  }
}

export { themes };
