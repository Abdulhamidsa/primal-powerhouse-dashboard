import { accentThemeIds } from './ids';
import { composeTheme } from './compose';

/** @deprecated Use composeTheme(mode, accentTheme). This preserves old consumers during migration. */
export const themes = Object.fromEntries(
  accentThemeIds.map(accentTheme => [accentTheme, composeTheme('dark', accentTheme)]),
) as Record<(typeof accentThemeIds)[number], ReturnType<typeof composeTheme>>;

export type Themes = typeof themes;
