import { httpClient } from '@/lib/http/client';
import { themeIdSchema, type ThemeId } from '@primal/theme';

export const THEME_PREFERENCE_URL = '/api/user/theme-preference';

export type ThemePreferenceResponse = {
  userId: string;
  themePreference: ThemeId;
};

export async function getThemePreference(): Promise<ThemePreferenceResponse> {
  const response = await httpClient.get<ThemePreferenceResponse>(THEME_PREFERENCE_URL);
  return { ...response, themePreference: themeIdSchema.parse(response.themePreference) };
}

export async function updateThemePreference(themePreference: ThemeId): Promise<ThemePreferenceResponse> {
  const response = await httpClient.put<ThemePreferenceResponse>(THEME_PREFERENCE_URL, { themePreference });
  return { ...response, themePreference: themeIdSchema.parse(response.themePreference) };
}
