import type { AppearanceModeOption, ThemeOption } from './types';

export const themeOptions: readonly ThemeOption[] = [
  { id: 'ember', label: 'Ember', description: 'Warm burnt copper.', isDefault: true },
  { id: 'ocean', label: 'Ocean', description: 'Controlled blue.' },
  { id: 'forest', label: 'Forest', description: 'Muted emerald.' },
  { id: 'ruby', label: 'Ruby', description: 'Wine crimson.' },
  { id: 'aura', label: 'Aura', description: 'Lavender violet.' },
  { id: 'arctic', label: 'Arctic', description: 'Clean cyan ice-blue.' },
  { id: 'dusk', label: 'Dusk', description: 'Dusty rose.' },
  { id: 'onyx', label: 'Onyx', description: 'Silver-white restraint.' },
];

export const accentThemeOptions = themeOptions;

export const appearanceModeOptions: readonly AppearanceModeOption[] = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
];
