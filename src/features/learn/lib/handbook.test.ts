import { describe, expect, it } from 'vitest';
import { FAQ_ENTRIES } from '@/features/learn/data/faq';
import { HANDBOOK_CHAPTERS, HANDBOOK_PAGES } from '@/features/learn/data/handbook';
import { filterFaqEntries, getAdjacentHandbookIndex, getHandbookPageIndex, getHandbookProgress } from '@/features/learn/lib/handbook';

describe('handbook navigation', () => {
  it('ships the intended 15-page first volume with unique stable IDs', () => {
    expect(HANDBOOK_PAGES).toHaveLength(15);
    expect(new Set(HANDBOOK_PAGES.map(page => page.id)).size).toBe(HANDBOOK_PAGES.length);
  });

  it('resolves stable IDs and falls back for unknown IDs', () => {
    expect(getHandbookPageIndex('fuel-macros')).toBeGreaterThan(0);
    expect(getHandbookPageIndex('missing-page')).toBe(0);
  });

  it('clamps previous and next navigation at the page boundaries', () => {
    expect(getAdjacentHandbookIndex(0, -1)).toBe(0);
    expect(getAdjacentHandbookIndex(HANDBOOK_PAGES.length - 1, 1)).toBe(HANDBOOK_PAGES.length - 1);
  });

  it('calculates progress from the clamped page position', () => {
    expect(getHandbookProgress(0)).toBe(0);
    expect(getHandbookProgress(HANDBOOK_PAGES.length - 1)).toBe(100);
  });
});

describe('Method content', () => {
  it('keeps the six-stage Method index aligned with handbook chapters', () => {
    expect(HANDBOOK_CHAPTERS.map(chapter => chapter.id)).toEqual([
      'foundation', 'train', 'fuel', 'recover', 'track', 'adapt',
    ]);
    expect(FAQ_ENTRIES.some(entry => 'handbookPageId' in entry)).toBe(false);
  });

  it('searches question and answer text case-insensitively', () => {
    expect(filterFaqEntries(FAQ_ENTRIES, 'PROTEIN').map(entry => entry.id)).toContain('protein');
    expect(filterFaqEntries(FAQ_ENTRIES, 'water').map(entry => entry.id)).toContain('overnight-weight');
    expect(filterFaqEntries(FAQ_ENTRIES, 'not-a-real-topic')).toEqual([]);
  });
});
