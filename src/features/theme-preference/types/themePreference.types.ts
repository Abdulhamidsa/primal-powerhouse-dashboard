import { z } from 'zod';
import { themePreferenceSchema } from '@/features/theme-preference/schemas/themePreference.schema';

export type ThemePreference = z.infer<typeof themePreferenceSchema>;

export type ThemeOption = {
  value: ThemePreference;
  label: string;
  swatchClassName: string;
};

export const THEME_OPTIONS: ThemeOption[] = [
  { value: 'ember', label: 'Ember', swatchClassName: 'bg-[#b86a4e]' },
  { value: 'ocean', label: 'Ocean', swatchClassName: 'bg-[#3b82f6]' },
  { value: 'forest', label: 'Forest', swatchClassName: 'bg-[#22c55e]' },
  { value: 'ruby', label: 'Ruby', swatchClassName: 'bg-[#ef4444]' },
];
