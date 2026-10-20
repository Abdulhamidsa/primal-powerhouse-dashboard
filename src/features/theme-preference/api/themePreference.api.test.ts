import { describe, expect, it } from 'vitest';
import {
  getAppearanceStorageKey,
  getThemeStorageKey,
  normalizeAppearance,
} from './themePreference.api';

describe('theme preference storage', () => {
  it('keeps admin and user storage keys separate per account', () => {
    expect(getAppearanceStorageKey('account-a', 'user')).toBe('pph_user_appearance_v1:account-a');
    expect(getAppearanceStorageKey('account-a', 'admin')).toBe('pph_admin_appearance_v1:account-a');
    expect(getThemeStorageKey('account-a', 'user')).not.toBe(getThemeStorageKey('account-a', 'admin'));
  });

  it('normalizes valid appearance values and rejects invalid accents', () => {
    expect(normalizeAppearance({ mode: 'light', accentTheme: 'ocean' })).toEqual({ mode: 'light', accentTheme: 'ocean' });
    expect(normalizeAppearance({ mode: 'dark', accentTheme: 'not-a-theme' })).toBeNull();
  });
});
