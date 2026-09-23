import { HANDBOOK_PAGES } from '@/features/learn/data/handbook';
import type { FaqEntry } from '@/features/learn/types/learn.types';

export const HANDBOOK_STORAGE_KEY = 'primal:handbook:v1:last-page-id';

export function getHandbookPageIndex(pageId?: string | null): number {
  if (!pageId) return 0;
  const index = HANDBOOK_PAGES.findIndex(page => page.id === pageId);
  return index >= 0 ? index : 0;
}

export function getHandbookProgress(pageIndex: number): number {
  if (HANDBOOK_PAGES.length <= 1) return 100;
  const clamped = Math.min(Math.max(pageIndex, 0), HANDBOOK_PAGES.length - 1);
  return Math.round((clamped / (HANDBOOK_PAGES.length - 1)) * 100);
}

export function isHandbookPageId(value: string): boolean {
  return HANDBOOK_PAGES.some(page => page.id === value);
}

export function filterFaqEntries(entries: FaqEntry[], query: string): FaqEntry[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return entries;
  return entries.filter(entry => `${entry.question} ${entry.answer}`.toLocaleLowerCase().includes(normalized));
}

export function getAdjacentHandbookIndex(pageIndex: number, direction: -1 | 1): number {
  return Math.min(Math.max(pageIndex + direction, 0), HANDBOOK_PAGES.length - 1);
}
