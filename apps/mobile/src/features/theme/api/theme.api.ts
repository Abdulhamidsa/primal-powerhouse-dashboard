import AsyncStorage from '@react-native-async-storage/async-storage';
import { accentThemeIdSchema, appearanceModeSchema, DEFAULT_ACCENT_THEME_ID, DEFAULT_APPEARANCE_MODE, type AccentThemeId, type AppearanceMode, type AppearanceSelection } from '@primal/theme';
import { httpClient } from '@/lib/http/client';

const APPEARANCE_STORAGE_KEY = 'primal:appearance:v1';
const LEGACY_THEME_STORAGE_KEY = 'primal:theme';
let current: AppearanceSelection = { mode: DEFAULT_APPEARANCE_MODE, accentTheme: DEFAULT_ACCENT_THEME_ID };
const listeners = new Set<() => void>();

export const getAppearance = () => current;
export const subscribeAppearance = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function getAppearanceStorageKey(userId?: string | null): string {
  return userId ? `primal:${userId}:appearance:v1` : APPEARANCE_STORAGE_KEY;
}

function getLegacyThemeStorageKey(userId?: string | null): string {
  return userId ? `primal:${userId}:theme` : LEGACY_THEME_STORAGE_KEY;
}

function resolveAppearance(value: unknown): AppearanceSelection | null {
  if (!value || typeof value !== 'object') return null;
  const selection = value as Partial<AppearanceSelection>;
  const accent = accentThemeIdSchema.safeParse(selection.accentTheme);
  if (!accent.success) return null;
  const mode = appearanceModeSchema.safeParse(selection.mode);
  return { mode: mode.success ? mode.data : DEFAULT_APPEARANCE_MODE, accentTheme: accent.data };
}

function notify() { listeners.forEach(listener => listener()); }
function setCurrent(selection: AppearanceSelection) { current = selection; notify(); }

async function readStoredAppearance(userId?: string | null): Promise<AppearanceSelection | null> {
  const raw = await AsyncStorage.getItem(getAppearanceStorageKey(userId));
  if (raw) {
    try {
      const parsed = resolveAppearance(JSON.parse(raw));
      if (parsed) return parsed;
    } catch { /* Read accent-only storage below. */ }
  }
  const legacy = accentThemeIdSchema.safeParse(await AsyncStorage.getItem(getLegacyThemeStorageKey(userId)));
  return legacy.success ? { mode: DEFAULT_APPEARANCE_MODE, accentTheme: legacy.data } : null;
}

async function cacheAppearance(selection: AppearanceSelection, userId?: string | null) {
  await AsyncStorage.setItem(getAppearanceStorageKey(userId), JSON.stringify(selection));
}

export async function selectAppearance(update: Partial<AppearanceSelection>, userId?: string | null) {
  const next = {
    mode: update.mode && appearanceModeSchema.safeParse(update.mode).success ? update.mode : current.mode,
    accentTheme: update.accentTheme && accentThemeIdSchema.safeParse(update.accentTheme).success ? update.accentTheme : current.accentTheme,
  } as AppearanceSelection;
  setCurrent(next);
  await cacheAppearance(next, userId);
  if (!userId) return;
  try {
    await httpClient.send('/api/user/theme-preference', 'PUT', update);
  } catch { /* Keep the local choice; the next restore reconciles it. */ }
}

export async function restoreAppearance(userId?: string | null) {
  const saved = await readStoredAppearance(userId);
  if (saved) setCurrent(saved);
  if (!userId) return;
  try {
    const response = await httpClient.get<{ mode?: string; accentTheme?: string; themePreference?: string }>('/api/user/theme-preference');
    const remote = resolveAppearance({ mode: response.mode, accentTheme: response.accentTheme ?? response.themePreference });
    if (!remote) return;
    setCurrent(remote);
    await cacheAppearance(remote, userId);
  } catch { /* Offline startup continues with the cached appearance. */ }
}

export type { AccentThemeId, AppearanceMode };
