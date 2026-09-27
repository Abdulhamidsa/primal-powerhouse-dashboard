export const themeIds = ['ember', 'ocean', 'forest', 'ruby', 'aura', 'arctic', 'dusk', 'onyx'] as const;

export type ThemeId = (typeof themeIds)[number];

export const DEFAULT_THEME_ID: ThemeId = 'ember';
