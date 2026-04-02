import { z } from 'zod';
import { themePreferenceSchema } from '@/features/theme-preference/schemas/themePreference.schema';

export type ThemePreference = z.infer<typeof themePreferenceSchema>;

export type ThemeOption = {
  value: ThemePreference;
  label: string;
  swatchVarName: string;
};

export const THEME_OPTIONS: ThemeOption[] = [
  { value: 'ember', label: 'Ember', swatchVarName: '--theme-ember-accent' },
  { value: 'ocean', label: 'Ocean', swatchVarName: '--theme-ocean-accent' },
  { value: 'forest', label: 'Forest', swatchVarName: '--theme-forest-accent' },
  { value: 'ruby', label: 'Ruby', swatchVarName: '--theme-ruby-accent' },
];
