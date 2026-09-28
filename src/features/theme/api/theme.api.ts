import { httpClient } from '@/lib/http/client';
import { accentThemeIdSchema, appearanceModeSchema, type AccentThemeId, type AppearanceMode } from '@primal/theme';

export const THEME_PREFERENCE_URL = '/api/user/theme-preference';

export type ThemePreferenceResponse = {
  userId: string;
  mode: AppearanceMode;
  accentTheme: AccentThemeId;
  /** Legacy field retained for callers and migrations. */
  themePreference: AccentThemeId;
};

function normalizeResponse(response: Partial<ThemePreferenceResponse> & { userId: string }): ThemePreferenceResponse {
  const accent = accentThemeIdSchema.safeParse(response.accentTheme ?? response.themePreference);
  const mode = appearanceModeSchema.safeParse(response.mode);
  const accentTheme = accent.success ? accent.data : 'ember';
  return { userId: response.userId, mode: mode.success ? mode.data : 'dark', accentTheme, themePreference: accentTheme };
}

export async function getThemePreference(): Promise<ThemePreferenceResponse> {
  return normalizeResponse(await httpClient.get<ThemePreferenceResponse>(THEME_PREFERENCE_URL));
}

export async function updateAppearancePreference(update: Partial<Pick<ThemePreferenceResponse, 'mode' | 'accentTheme'>>): Promise<ThemePreferenceResponse> {
  return normalizeResponse(await httpClient.put<ThemePreferenceResponse>(THEME_PREFERENCE_URL, update));
}

export async function updateThemePreference(themePreference: AccentThemeId): Promise<ThemePreferenceResponse> {
  return updateAppearancePreference({ accentTheme: themePreference });
}
