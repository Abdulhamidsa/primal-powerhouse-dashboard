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
    navigationBackground: palette.surfaceElevated,
    navigationBorder: palette.borderStrong,
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
    background: '#151311',
    surface: '#1d1a17',
    surfaceElevated: '#29231e',
    surfaceHover: '#342a23',
    card: '#211d19',
    border: '#3a3027',
    borderStrong: '#574537',
    accent: '#c47b59',
    accentHover: '#d28a66',
    accentPressed: '#a86145',
    accentMuted: 'rgba(196, 123, 89, 0.16)',
    onAccent: '#1a100b',
    focusRing: '#d28a66',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.28)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.44)',
    chartPrimary: '#c47b59',
    chartSecondary: '#d9a65a',
  }),
  ocean: createTheme({
    background: '#0b1420',
    surface: '#111f2e',
    surfaceElevated: '#1b3045',
    surfaceHover: '#23415b',
    card: '#142638',
    border: '#29415a',
    borderStrong: '#3f607d',
    accent: '#5aa9e6',
    accentHover: '#73b9ed',
    accentPressed: '#4389c3',
    accentMuted: 'rgba(90, 169, 230, 0.16)',
    onAccent: '#07111b',
    focusRing: '#73b9ed',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.30)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.46)',
    chartPrimary: '#5aa9e6',
    chartSecondary: '#8bb8d9',
  }),
  forest: createTheme({
    background: '#0c1512',
    surface: '#14231d',
    surfaceElevated: '#20382d',
    surfaceHover: '#2a4738',
    card: '#182c24',
    border: '#2c4a3a',
    borderStrong: '#47705a',
    accent: '#5faf7a',
    accentHover: '#72bd8e',
    accentPressed: '#488c61',
    accentMuted: 'rgba(95, 175, 122, 0.16)',
    onAccent: '#08140e',
    focusRing: '#72bd8e',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.32)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.48)',
    chartPrimary: '#5faf7a',
    chartSecondary: '#a8c783',
  }),
  ruby: createTheme({
    background: '#1a0d12',
    surface: '#28131b',
    surfaceElevated: '#3d1c2a',
    surfaceHover: '#512535',
    card: '#311722',
    border: '#55293a',
    borderStrong: '#774051',
    accent: '#c95f74',
    accentHover: '#d7778a',
    accentPressed: '#a94b61',
    accentMuted: 'rgba(201, 95, 116, 0.16)',
    onAccent: '#24090f',
    focusRing: '#d7778a',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.34)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.50)',
    chartPrimary: '#c95f74',
    chartSecondary: '#d9a65a',
  }),
  aura: createTheme({
    background: '#120f1b',
    surface: '#1b1729',
    surfaceElevated: '#2a2440',
    surfaceHover: '#382f52',
    card: '#211c32',
    border: '#413659',
    borderStrong: '#5e4c7d',
    accent: '#aa95e8',
    accentHover: '#baa8f0',
    accentPressed: '#8d78c9',
    accentMuted: 'rgba(170, 149, 232, 0.16)',
    onAccent: '#140d2e',
    focusRing: '#baa8f0',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.34)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.50)',
    chartPrimary: '#aa95e8',
    chartSecondary: '#8bb8d9',
  }),
  arctic: createTheme({
    background: '#0a141d',
    surface: '#112331',
    surfaceElevated: '#1c394c',
    surfaceHover: '#285268',
    card: '#162d3d',
    border: '#2c5064',
    borderStrong: '#42738a',
    accent: '#65c7d8',
    accentHover: '#7bd4e2',
    accentPressed: '#4da6b7',
    accentMuted: 'rgba(101, 199, 216, 0.16)',
    onAccent: '#061519',
    focusRing: '#7bd4e2',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.28)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.44)',
    chartPrimary: '#65c7d8',
    chartSecondary: '#8bb8d9',
  }),
  dusk: createTheme({
    background: '#1a1017',
    surface: '#261720',
    surfaceElevated: '#3b2331',
    surfaceHover: '#4b2d3c',
    card: '#2f1d29',
    border: '#563444',
    borderStrong: '#75495b',
    accent: '#c9829a',
    accentHover: '#d697ad',
    accentPressed: '#ab667f',
    accentMuted: 'rgba(201, 130, 154, 0.16)',
    onAccent: '#2a0e1a',
    focusRing: '#d697ad',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.34)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.50)',
    chartPrimary: '#c9829a',
    chartSecondary: '#d9a65a',
  }),
  onyx: createTheme({
    background: '#090a0b',
    surface: '#121416',
    surfaceElevated: '#202428',
    surfaceHover: '#2a2f34',
    card: '#181b1e',
    border: '#34393e',
    borderStrong: '#50575e',
    accent: '#c8ccd1',
    accentHover: '#e0e3e6',
    accentPressed: '#aeb4ba',
    accentMuted: 'rgba(200, 204, 209, 0.14)',
    onAccent: '#0b0d0f',
    focusRing: '#e0e3e6',
    shadow: '0 12px 36px rgba(0, 0, 0, 0.40)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.56)',
    chartPrimary: '#c8ccd1',
    chartSecondary: '#8f989f',
  }),
} satisfies Record<ThemeId, ThemeTokens>;

export type Themes = typeof themes;
