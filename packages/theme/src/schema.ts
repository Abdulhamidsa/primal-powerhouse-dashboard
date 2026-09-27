import { z } from 'zod';
import { themeIds } from './ids';
import type { ThemeTokens } from './types';

export const themeIdSchema = z.enum(themeIds);
const themeTokenKeys: Record<keyof ThemeTokens, z.ZodString> = {
  background: z.string(), surface: z.string(), surfaceElevated: z.string(), surfaceHover: z.string(), card: z.string(),
  border: z.string(), borderStrong: z.string(), text: z.string(), textMuted: z.string(), textSubtle: z.string(),
  accent: z.string(), accentHover: z.string(), accentPressed: z.string(), accentMuted: z.string(), onAccent: z.string(),
  inputBackground: z.string(), inputBorder: z.string(), navigationBackground: z.string(), navigationBorder: z.string(),
  navigationActive: z.string(), navigationInactive: z.string(), navigationActiveBackground: z.string(), icon: z.string(),
  iconMuted: z.string(), placeholder: z.string(), disabled: z.string(), disabledBackground: z.string(), disabledText: z.string(),
  success: z.string(), successMuted: z.string(), onSuccess: z.string(), warning: z.string(), warningMuted: z.string(),
  onWarning: z.string(), error: z.string(), errorMuted: z.string(), onError: z.string(), info: z.string(), infoMuted: z.string(),
  onInfo: z.string(), overlay: z.string(), overlayStrong: z.string(), focusRing: z.string(), shadow: z.string(), shadowStrong: z.string(),
  chartGrid: z.string(), chartPrimary: z.string(), chartSecondary: z.string(),
};

export const themeTokensSchema = z.object(themeTokenKeys);
export const themesSchema = z.record(themeIdSchema, themeTokensSchema);
export type ThemeIdInput = z.infer<typeof themeIdSchema>;
