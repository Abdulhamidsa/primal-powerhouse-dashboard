import { describe, expect, it } from 'vitest';
import { accentThemeIds, appearanceModeIds } from './ids';
import { accentThemes } from './accents';
import { composeTheme } from './compose';
import { baseModes } from './modes';
import { themeTokensSchema } from './schema';

function hexToRgb(hex: string) {
  const match = hex.match(/^#([0-9a-f]{6})$/i);
  if (!match) throw new Error(`Invalid hex color: ${hex}`);
  const value = Number.parseInt(match[1], 16);
  return {
    r: value >> 16,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function channelSpread(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return Math.max(r, g, b) - Math.min(r, g, b);
}

describe('composed appearance tokens', () => {
  it('creates a complete semantic contract for every mode and accent combination', () => {
    for (const mode of appearanceModeIds) for (const accentTheme of accentThemeIds) {
      expect(themeTokensSchema.safeParse(composeTheme(mode, accentTheme)).success).toBe(true);
    }
  });

  it('keeps neutral foundations unchanged when only the accent changes', () => {
    for (const mode of appearanceModeIds) {
      const ember = composeTheme(mode, 'ember');
      const ocean = composeTheme(mode, 'ocean');
      expect(ember.background).toBe(ocean.background);
      expect(ember.card).toBe(ocean.card);
      expect(ember.border).toBe(ocean.border);
      expect(ember.text).toBe(ocean.text);
      expect(ember.success).toBe(ocean.success);
    }
  });

  it('keeps accent behavior unchanged when only the mode changes', () => {
    for (const accentTheme of accentThemeIds) {
      const dark = composeTheme('dark', accentTheme);
      const light = composeTheme('light', accentTheme);
      expect(dark.accent).toBe(light.accent);
      expect(dark.focusRing).toBe(light.focusRing);
      expect(dark.chartSecondary).toBe(light.chartSecondary);
    }
  });

  it('uses neutral passive surfaces and expressive accents', () => {
    for (const mode of appearanceModeIds) {
      const passiveSurfaceSpread = [baseModes[mode].background, baseModes[mode].surface, baseModes[mode].card].map(channelSpread);
      passiveSurfaceSpread.forEach(spread => expect(spread).toBeLessThanOrEqual(18));
    }
    for (const [id, tokens] of Object.entries(accentThemes)) {
      expect(channelSpread(tokens.accent), id).toBeGreaterThanOrEqual(id === 'onyx' ? 8 : 32);
    }
  });
});
