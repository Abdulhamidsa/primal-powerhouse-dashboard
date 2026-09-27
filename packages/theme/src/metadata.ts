import type { ThemeOption } from './types';

export const themeOptions: readonly ThemeOption[] = [
  { id: 'ember', label: 'Ember', description: 'Warm copper over charcoal.', isDefault: true },
  { id: 'ocean', label: 'Ocean', description: 'Deep navy with controlled blue.' },
  { id: 'forest', label: 'Forest', description: 'Dark moss with muted emerald.' },
  { id: 'ruby', label: 'Ruby', description: 'Black cherry with wine crimson.' },
  { id: 'aura', label: 'Aura', description: 'Atmospheric violet and lavender.' },
  { id: 'arctic', label: 'Arctic', description: 'Icy slate with clean cyan.' },
  { id: 'dusk', label: 'Dusk', description: 'Muted plum and dusty rose.' },
  { id: 'onyx', label: 'Onyx', description: 'Graphite, silver, and restraint.' },
];
