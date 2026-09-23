'use client';

import { useCallback, useEffect, useState } from 'react';
import { HANDBOOK_PAGES } from '@/features/learn/data/handbook';
import { getAdjacentHandbookIndex, getHandbookPageIndex, HANDBOOK_STORAGE_KEY, isHandbookPageId } from '@/features/learn/lib/handbook';

export function useHandbookReader() {
  const [isOpen, setIsOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasRestored, setHasRestored] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(HANDBOOK_STORAGE_KEY);
      if (saved && isHandbookPageId(saved)) setPageIndex(getHandbookPageIndex(saved));
    } catch {
      // Storage may be unavailable in privacy modes. Reading still works without persistence.
    } finally {
      setHasRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!hasRestored) return;
    try {
      window.localStorage.setItem(HANDBOOK_STORAGE_KEY, HANDBOOK_PAGES[pageIndex]?.id ?? 'contents');
    } catch {
      // Persistence is an enhancement, not a requirement.
    }
  }, [hasRestored, pageIndex]);

  const goToPage = useCallback((pageId: string) => setPageIndex(getHandbookPageIndex(pageId)), []);
  const open = useCallback((pageId?: string) => {
    if (pageId) setPageIndex(getHandbookPageIndex(pageId));
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);
  const next = useCallback(() => setPageIndex(current => getAdjacentHandbookIndex(current, 1)), []);
  const previous = useCallback(() => setPageIndex(current => getAdjacentHandbookIndex(current, -1)), []);

  return { isOpen, pageIndex, open, close, next, previous, goToPage, setPageIndex };
}
