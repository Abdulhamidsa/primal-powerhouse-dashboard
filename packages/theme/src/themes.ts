import type { ThemeId } from './ids';
import type { ThemeTokens } from './types';

const sharedStatusTokens = {
  success: '#55b77a',
  successMuted: 'rgba(85, 183, 122, 0.16)',
  onSuccess: '#07150d',
  warning: '#d9a65a',
  warningMuted: 'rgba(217, 166, 90, 0.16)',
  onWarning: '#211707',
  error: '#d97575',
  errorMuted: 'rgba(217, 117, 117, 0.16)',
  onError: '#260b0b',
  info: '#6aa8d8',
  infoMuted: 'rgba(106, 168, 216, 0.16)',
  onInfo: '#07131f',
} as const;

type ThemePalette = Pick<
  ThemeTokens,
  | 'background'
  | 'surface'
  | 'surfaceElevated'
  | 'surfaceHover'
  | 'card'
  | 'border'
  | 'borderStrong'
  | 'accent'
  | 'accentHover'
  | 'accentPressed'
  | 'accentMuted'
  | 'onAccent'
  | 'focusRing'
  | 'shadow'
  | 'shadowStrong'
  | 'chartPrimary'
  | 'chartSecondary'
>;

function createTheme(palette: ThemePalette): ThemeTokens {
  const text = '#f4f1ec';
  const textMuted = '#a9a6a0';
  const textSubtle = '#77756f';
  const icon = text;
  const iconMuted = textMuted;

  return {
    ...palette,
    text,
    textMuted,
    textSubtle,
    inputBackground: palette.surface,
    inputBorder: palette.border,
    navigationBackground: palette.surface,
    navigationBorder: palette.border,
    navigationActive: palette.accent,
    navigationInactive: iconMuted,
    navigationActiveBackground: palette.accentMuted,
    icon,
    iconMuted,
    placeholder: textSubtle,
    disabled: '#4b4b49',
    disabledBackground: palette.surfaceHover,
    disabledText: '#77756f',
    ...sharedStatusTokens,
    overlay: 'rgba(0, 0, 0, 0.48)',
    overlayStrong: 'rgba(0, 0, 0, 0.72)',
    shadow: palette.shadow,
    shadowStrong: palette.shadowStrong,
    chartGrid: palette.border,
  };
}

export const themes = {
  ember: createTheme({
    background: '#12100f',
    surface: '#171513',
    surfaceElevated: '#1e1a17',
    surfaceHover: '#25201d',
    card: '#1a1614',
    border: '#2f2924',
    borderStrong: '#3f3730',
    accent: '#c47b59',
    accentHover: '#d28a66',
    accentPressed: '#a86145',
    accentMuted: 'rgba(196, 123, 89, 0.12)',
    onAccent: '#1a100b',
    focusRing: '#d28a66',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.28)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.44)',
    chartPrimary: '#c47b59',
    chartSecondary: '#d9a65a',
  }),
  ocean: createTheme({
    background: '#0f1216',
    surface: '#14191f',
    surfaceElevated: '#1b2128',
    surfaceHover: '#242d36',
    card: '#171d24',
    border: '#2b3540',
    borderStrong: '#3b4856',
    accent: '#5aa9e6',
    accentHover: '#73b9ed',
    accentPressed: '#4389c3',
    accentMuted: 'rgba(90, 169, 230, 0.12)',
    onAccent: '#07111b',
    focusRing: '#73b9ed',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.30)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.46)',
    chartPrimary: '#5aa9e6',
    chartSecondary: '#8bb8d9',
  }),
  forest: createTheme({
    background: '#10130f',
    surface: '#151a16',
    surfaceElevated: '#1d231e',
    surfaceHover: '#252e28',
    card: '#181d19',
    border: '#2c3730',
    borderStrong: '#3b493f',
    accent: '#5faf7a',
    accentHover: '#72bd8e',
    accentPressed: '#488c61',
    accentMuted: 'rgba(95, 175, 122, 0.12)',
    onAccent: '#08140e',
    focusRing: '#72bd8e',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.32)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.48)',
    chartPrimary: '#5faf7a',
    chartSecondary: '#a8c783',
  }),
  ruby: createTheme({
    background: '#120f11',
    surface: '#181417',
    surfaceElevated: '#211b20',
    surfaceHover: '#2b242a',
    card: '#1b1619',
    border: '#342c32',
    borderStrong: '#463b43',
    accent: '#c95f74',
    accentHover: '#d7778a',
    accentPressed: '#a94b61',
    accentMuted: 'rgba(201, 95, 116, 0.12)',
    onAccent: '#24090f',
    focusRing: '#d7778a',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.34)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.50)',
    chartPrimary: '#c95f74',
    chartSecondary: '#d9a65a',
  }),
  aura: createTheme({
    background: '#111016',
    surface: '#171520',
    surfaceElevated: '#201d2b',
    surfaceHover: '#2a2636',
    card: '#1a1825',
    border: '#343041',
    borderStrong: '#454055',
    accent: '#aa95e8',
    accentHover: '#baa8f0',
    accentPressed: '#8d78c9',
    accentMuted: 'rgba(170, 149, 232, 0.12)',
    onAccent: '#140d2e',
    focusRing: '#baa8f0',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.34)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.50)',
    chartPrimary: '#aa95e8',
    chartSecondary: '#8bb8d9',
  }),
  arctic: createTheme({
    background: '#0f1215',
    surface: '#14191e',
    surfaceElevated: '#1b2128',
    surfaceHover: '#242c35',
    card: '#171c22',
    border: '#2b3742',
    borderStrong: '#3a4956',
    accent: '#65c7d8',
    accentHover: '#7bd4e2',
    accentPressed: '#4da6b7',
    accentMuted: 'rgba(101, 199, 216, 0.12)',
    onAccent: '#061519',
    focusRing: '#7bd4e2',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.28)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.44)',
    chartPrimary: '#65c7d8',
    chartSecondary: '#8bb8d9',
  }),
  dusk: createTheme({
    background: '#121015',
    surface: '#18151c',
    surfaceElevated: '#211d26',
    surfaceHover: '#2b2530',
    card: '#1b1720',
    border: '#342e3a',
    borderStrong: '#463f4d',
    accent: '#c9829a',
    accentHover: '#d697ad',
    accentPressed: '#ab667f',
    accentMuted: 'rgba(201, 130, 154, 0.12)',
    onAccent: '#2a0e1a',
    focusRing: '#d697ad',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.34)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.50)',
    chartPrimary: '#c9829a',
    chartSecondary: '#d9a65a',
  }),
  onyx: createTheme({
    background: '#090a0b',
    surface: '#111316',
    surfaceElevated: '#191c20',
    surfaceHover: '#23282d',
    card: '#15181c',
    border: '#2e343a',
    borderStrong: '#3f474f',
    accent: '#c8ccd1',
    accentHover: '#e0e3e6',
    accentPressed: '#aeb4ba',
    accentMuted: 'rgba(200, 204, 209, 0.10)',
    onAccent: '#0b0d0f',
    focusRing: '#e0e3e6',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.40)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.56)',
    chartPrimary: '#c8ccd1',
    chartSecondary: '#8f989f',
  }),
} satisfies Record<ThemeId, ThemeTokens>;

export type Themes = typeof themes;
