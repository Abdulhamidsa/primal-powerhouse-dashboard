import { httpClient } from '@/lib/http/client';
import { accentThemeIdSchema, appearanceModeSchema, DEFAULT_ACCENT_THEME_ID, type AccentThemeId, type AppearanceMode } from '@primal/theme';

export type ThemePreferenceScope = 'user' | 'admin';

export const THEME_PREFERENCE_URL = '/api/user/theme-preference';
export const ADMIN_THEME_PREFERENCE_URL = '/api/admin/theme-preference';

export type ThemePreferenceResponse = {
  userId: string;
  mode: AppearanceMode;
  accentTheme: AccentThemeId;
  /** Legacy field retained for callers and migrations. */
  themePreference: AccentThemeId;
};

function normalizeResponse(response: Partial<ThemePreferenceResponse> & { userId: string }, scope: ThemePreferenceScope): ThemePreferenceResponse {
  const accent = accentThemeIdSchema.safeParse(response.accentTheme ?? response.themePreference);
  const mode = appearanceModeSchema.safeParse(response.mode);
  const accentTheme = accent.success ? accent.data : scope === 'admin' ? 'ocean' : DEFAULT_ACCENT_THEME_ID;
  return { userId: response.userId, mode: mode.success ? mode.data : 'dark', accentTheme, themePreference: accentTheme };
}

function getPreferenceUrl(scope: ThemePreferenceScope): string {
  return scope === 'admin' ? ADMIN_THEME_PREFERENCE_URL : THEME_PREFERENCE_URL;
}

export async function getThemePreference(scope: ThemePreferenceScope = 'user'): Promise<ThemePreferenceResponse> {
  return normalizeResponse(await httpClient.get<ThemePreferenceResponse>(getPreferenceUrl(scope)), scope);
}

export async function updateAppearancePreference(update: Partial<Pick<ThemePreferenceResponse, 'mode' | 'accentTheme'>>, scope: ThemePreferenceScope = 'user'): Promise<ThemePreferenceResponse> {
  return normalizeResponse(await httpClient.put<ThemePreferenceResponse>(getPreferenceUrl(scope), update), scope);
}

export async function updateThemePreference(themePreference: AccentThemeId, scope: ThemePreferenceScope = 'user'): Promise<ThemePreferenceResponse> {
  return updateAppearancePreference({ accentTheme: themePreference }, scope);
}
