import type { AccentThemeId, AppearanceMode, ThemeId } from './ids';

export type ThemeTokens = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceHover: string;
  card: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  accentHover: string;
  accentPressed: string;
  accentMuted: string;
  onAccent: string;
  link: string;
  linkHover: string;
  inputBackground: string;
  inputBorder: string;
  navigationBackground: string;
  navigationBorder: string;
  navigationActive: string;
  navigationInactive: string;
  navigationActiveBackground: string;
  icon: string;
  iconMuted: string;
  placeholder: string;
  disabled: string;
  disabledBackground: string;
  disabledText: string;
  success: string;
  successMuted: string;
  onSuccess: string;
  warning: string;
  warningMuted: string;
  onWarning: string;
  error: string;
  errorMuted: string;
  onError: string;
  info: string;
  infoMuted: string;
  onInfo: string;
  overlay: string;
  overlayStrong: string;
  focusRing: string;
  shadow: string;
  shadowStrong: string;
  chartGrid: string;
  chartPrimary: string;
  chartSecondary: string;
};

export type AccentTokens = Pick<
  ThemeTokens,
  | 'accent'
  | 'accentHover'
  | 'accentPressed'
  | 'accentMuted'
  | 'onAccent'
  | 'focusRing'
  | 'chartPrimary'
  | 'chartSecondary'
>;

export type BaseModeTokens = Omit<
  ThemeTokens,
  keyof AccentTokens | 'link' | 'linkHover' | 'navigationActive' | 'navigationActiveBackground'
>;

export type AppearanceSelection = {
  mode: AppearanceMode;
  accentTheme: AccentThemeId;
};

export type ThemeOption = {
  id: ThemeId;
  label: string;
  description: string;
  isDefault?: boolean;
};

export type AppearanceModeOption = {
  id: AppearanceMode;
  label: string;
};
