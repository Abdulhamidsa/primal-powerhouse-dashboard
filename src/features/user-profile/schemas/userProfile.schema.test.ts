import { describe, expect, it } from 'vitest';
import { updateDisplayNameSchema } from './userProfile.schema';

describe('updateDisplayNameSchema', () => {
  it('trims names and stores blank input as null', () => {
    expect(updateDisplayNameSchema.parse({ name: '  Alex  ' }).name).toBe('Alex');
    expect(updateDisplayNameSchema.parse({ name: '   ' }).name).toBeNull();
  });

  it('rejects names longer than 100 characters', () => {
    expect(() => updateDisplayNameSchema.parse({ name: 'x'.repeat(101) })).toThrow();
  });
});
