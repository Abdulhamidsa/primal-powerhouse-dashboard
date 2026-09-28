import { describe, expect, it } from 'vitest';
import { getPasswordStrength } from './passwordStrength';

describe('getPasswordStrength', () => {
  it('returns no label for an empty password', () => {
    expect(getPasswordStrength('')).toBeNull();
  });

  it('keeps short or repetitive passwords weak', () => {
    expect(getPasswordStrength('password')).toBe('Weak');
    expect(getPasswordStrength('aaaaaaaa')).toBe('Weak');
  });

  it('recognizes stronger passphrases without enforcing composition rules', () => {
    expect(getPasswordStrength('Steady progress every day 42!')).toBe('Strong');
  });
});
