import { describe, expect, it } from 'vitest';
import { themes } from './themes';

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

describe('semantic themes', () => {
  it('keeps passive surfaces dark and close to neutral while preserving accent identity', () => {
    for (const [themeId, tokens] of Object.entries(themes)) {
      const passiveSurfaceSpread = [tokens.background, tokens.surface, tokens.surfaceElevated, tokens.card].map(channelSpread);
      passiveSurfaceSpread.forEach(spread => {
        expect(spread, `${themeId} passive surfaces should stay near neutral`).toBeLessThanOrEqual(18);
      });

      const accentSpread = channelSpread(tokens.accent);
      const minAccentSpread = themeId === 'onyx' ? 8 : 32;
      expect(accentSpread, `${themeId} accent should remain visually expressive`).toBeGreaterThanOrEqual(minAccentSpread);
    }
  });

  it('keeps navigation and selected-state tokens aligned with neutral foundation', () => {
    for (const tokens of Object.values(themes)) {
      expect(tokens.navigationBackground).toBe(tokens.surface);
      expect(tokens.navigationBorder).toBe(tokens.border);
      expect(tokens.navigationActiveBackground).toBe(tokens.accentMuted);
    }
  });
});
