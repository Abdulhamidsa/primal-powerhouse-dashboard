import { accentThemes } from './accents';
import { baseModes } from './modes';
import type { AccentThemeId, AppearanceMode } from './ids';
import type { ThemeTokens } from './types';

export function composeTheme(mode: AppearanceMode, accentTheme: AccentThemeId): ThemeTokens {
  const base = baseModes[mode];
  const accent = accentThemes[accentTheme];
  return {
    ...base,
    ...accent,
    link: accent.accent,
    linkHover: accent.accentHover,
    navigationActive: accent.accent,
    navigationActiveBackground: accent.accentMuted,
  };
}
