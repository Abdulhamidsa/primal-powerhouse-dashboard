'use client';

import { useCallback, useEffect, useState } from 'react';
import { searchExerciseCatalogExercises } from '@/features/exercises/api/exerciseCatalog.api';
import type { ExerciseCatalogExercise, ExerciseCatalogResponse } from '@/features/exercises/types/exerciseCatalog.types';
import type { ExerciseCatalogFilters } from '@/features/exercises/types/exerciseCatalogFilters.types';

const CATALOG_PAGE_SIZE = 10;

export function useExerciseCatalog(initialQuery = '') {
  const [exercises, setExercises] = useState<ExerciseCatalogExercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<ExerciseCatalogFilters>({});
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  const search = useCallback(
    async (searchQuery: string, pageOffset = 0, currentFilters: ExerciseCatalogFilters = filters, cursor?: string | null) => {
      setIsLoading(true);
      setError(null);
      try {
        const response: ExerciseCatalogResponse = await searchExerciseCatalogExercises(
          searchQuery.trim(),
          currentFilters,
          pageOffset * CATALOG_PAGE_SIZE,
          CATALOG_PAGE_SIZE,
          false,
          cursor,
        );
        if (response.success) {
          if (pageOffset === 0) setExercises(response.data);
          else setExercises(previous => [...previous, ...response.data]);
          setHasMore(Boolean(response.metadata?.nextCursor || response.metadata?.nextPage));
          setNextCursor(response.metadata?.nextCursor ?? null);
          setCurrentPage(pageOffset);
        } else {
          setError(response.error || 'Failed to fetch exercises');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch exercises');
        console.error('WorkoutX catalog search error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setCurrentPage(0);
    setNextCursor(null);
    void search(debouncedQuery, 0, filters);
  }, [debouncedQuery, filters, search]);

  const updateFilters = useCallback((newFilters: ExerciseCatalogFilters) => {
    setFilters(newFilters);
    setCurrentPage(0);
    setNextCursor(null);
  }, []);

  const clearFilters = useCallback(() => updateFilters({}), [updateFilters]);
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) void search(query, currentPage + 1, filters, nextCursor);
  }, [currentPage, filters, hasMore, isLoading, nextCursor, query, search]);

  const loadAll = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      let pageOffset = currentPage;
      let cursor = nextCursor;
      let more: boolean = hasMore;
      let allExercises = exercises;
      const seenCursors = new Set<string>();

      while (more) {
        if (cursor) {
          if (seenCursors.has(cursor)) break;
          seenCursors.add(cursor);
        }

        const response = await searchExerciseCatalogExercises(
          debouncedQuery.trim(),
          filters,
          (pageOffset + 1) * CATALOG_PAGE_SIZE,
          CATALOG_PAGE_SIZE,
          false,
          cursor,
        );

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch exercises');
        }

        allExercises = [...allExercises, ...response.data];
        pageOffset += 1;
        cursor = response.metadata?.nextCursor ?? null;
        more = Boolean(response.metadata?.nextCursor || response.metadata?.nextPage);
      }

      setExercises(allExercises);
      setCurrentPage(pageOffset);
      setNextCursor(cursor);
      setHasMore(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exercises');
      console.error('WorkoutX catalog load-all error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedQuery, exercises, filters, hasMore, isLoading, nextCursor]);

  return {
    exercises,
    isLoading,
    error,
    query,
    setQuery,
    filters,
    updateFilters,
    clearFilters,
    currentPage,
    hasMore,
    loadMore,
    loadAll,
    search,
  };
}
