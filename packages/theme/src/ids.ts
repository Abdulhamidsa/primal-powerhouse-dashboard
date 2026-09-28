export const appearanceModeIds = ['dark', 'light'] as const;
export type AppearanceMode = (typeof appearanceModeIds)[number];
export const DEFAULT_APPEARANCE_MODE: AppearanceMode = 'dark';

export const accentThemeIds = ['ember', 'ocean', 'forest', 'ruby', 'aura', 'arctic', 'dusk', 'onyx'] as const;
export type AccentThemeId = (typeof accentThemeIds)[number];
export const DEFAULT_ACCENT_THEME_ID: AccentThemeId = 'ember';

/** @deprecated Use accentThemeIds. Kept while callers migrate from the old theme API. */
export const themeIds = accentThemeIds;
/** @deprecated Use AccentThemeId. */
export type ThemeId = AccentThemeId;
/** @deprecated Use DEFAULT_ACCENT_THEME_ID. */
export const DEFAULT_THEME_ID = DEFAULT_ACCENT_THEME_ID;
