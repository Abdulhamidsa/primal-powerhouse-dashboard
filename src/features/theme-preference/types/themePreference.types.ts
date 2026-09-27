import { z } from 'zod';
import { themeOptions } from '@primal/theme';
import { themePreferenceSchema } from '@/features/theme-preference/schemas/themePreference.schema';

export type ThemePreference = z.infer<typeof themePreferenceSchema>;

export type ThemeOption = {
  value: ThemePreference;
  label: string;
  description: string;
  isDefault?: boolean;
};

export const THEME_OPTIONS: ThemeOption[] = themeOptions.map(option => ({
  value: option.id,
  label: option.label,
  description: option.description,
  isDefault: option.isDefault,
}));
