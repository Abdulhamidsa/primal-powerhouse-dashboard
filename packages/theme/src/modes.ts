import type { AppearanceMode } from './ids';
import type { BaseModeTokens } from './types';

export const baseModes = {
  dark: {
    background: '#101112', surface: '#151618', surfaceElevated: '#1c1e21', surfaceHover: '#25282c', card: '#181a1d',
    border: '#2d3035', borderStrong: '#444850', text: '#f2f3f5', textMuted: '#a5a8ad', textSubtle: '#73777d',
    inputBackground: '#151618', inputBorder: '#2d3035', navigationBackground: '#151618', navigationBorder: '#2d3035',
    navigationInactive: '#a5a8ad', icon: '#e2e4e7', iconMuted: '#a5a8ad', placeholder: '#7e8289', disabled: '#60646a',
    disabledBackground: '#25282c', disabledText: '#85888d', success: '#55b77a', successMuted: 'rgba(85, 183, 122, 0.16)',
    onSuccess: '#07150d', warning: '#e0aa56', warningMuted: 'rgba(224, 170, 86, 0.16)', onWarning: '#211707',
    error: '#d97575', errorMuted: 'rgba(217, 117, 117, 0.16)', onError: '#260b0b', info: '#6aa8d8',
    infoMuted: 'rgba(106, 168, 216, 0.16)', onInfo: '#07131f', overlay: 'rgba(0, 0, 0, 0.52)',
    overlayStrong: 'rgba(0, 0, 0, 0.76)', shadow: '0 12px 36px rgba(0, 0, 0, 0.30)',
    shadowStrong: '0 24px 72px rgba(0, 0, 0, 0.48)', chartGrid: '#2d3035',
  },
  light: {
    background: '#f6f4f0', surface: '#fbfaf8', surfaceElevated: '#fffdfa', surfaceHover: '#f0eeea', card: '#fffdfa',
    border: '#dfddd8', borderStrong: '#c7c3bd', text: '#232426', textMuted: '#686b70', textSubtle: '#8a8c90',
    inputBackground: '#fffdfa', inputBorder: '#d6d2cb', navigationBackground: '#f9f7f3', navigationBorder: '#dfddd8',
    navigationInactive: '#686b70', icon: '#34363a', iconMuted: '#686b70', placeholder: '#8a8c90', disabled: '#a7a39d',
    disabledBackground: '#ece9e4', disabledText: '#96928d', success: '#27824d', successMuted: 'rgba(39, 130, 77, 0.12)',
    onSuccess: '#ffffff', warning: '#a6610a', warningMuted: 'rgba(166, 97, 10, 0.12)', onWarning: '#ffffff',
    error: '#b7474c', errorMuted: 'rgba(183, 71, 76, 0.12)', onError: '#ffffff', info: '#2e6f9e',
    infoMuted: 'rgba(46, 111, 158, 0.12)', onInfo: '#ffffff', overlay: 'rgba(19, 20, 21, 0.36)',
    overlayStrong: 'rgba(19, 20, 21, 0.56)', shadow: '0 12px 32px rgba(35, 36, 38, 0.10)',
    shadowStrong: '0 24px 64px rgba(35, 36, 38, 0.16)', chartGrid: '#dfddd8',
  },
} satisfies Record<AppearanceMode, BaseModeTokens>;
