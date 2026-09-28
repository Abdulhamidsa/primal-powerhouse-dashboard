import { describe, expect, it } from 'vitest';
import { buildMealAiContext, sanitizeAiText } from '@/lib/ai/data-minimization';

describe('AI data minimization', () => {
  it('keeps only meal-generation values and excludes identifiers', () => {
    const context = buildMealAiContext({
      calories: 2200,
      protein: 160,
      type: 'dinner',
      mealCount: 20,
      generateImages: true,
      imageProvider: 'azure',
      imageCheckpoint: 'private-checkpoint',
    });

    expect(context).toEqual({ calories: 2200, protein: 160, type: 'dinner', mealCount: 10 });
    expect(JSON.stringify(context)).not.toContain('private-checkpoint');
    expect(JSON.stringify(context)).not.toContain('clientId');
  });

  it('removes control characters and caps free text', () => {
    expect(sanitizeAiText('hello\u0000 world', 5)).toBe('hello');
  });
});
