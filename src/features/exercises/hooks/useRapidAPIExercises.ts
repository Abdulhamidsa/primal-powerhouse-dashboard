'use client';

import { useState, useCallback, useEffect } from 'react';
import { getRapidAPIExercises } from '@/features/exercises/api/exerciseDb.api';
import type { ExerciseDbExercise, ExerciseDbResponse } from '@/features/exercises/types/exerciseDb.types';
import type { RapidAPIFilters } from '@/features/exercises/types/rapidapi-filters.types';

export function useRapidAPIExercises(initialQuery: string = '') {
  const [exercises, setExercises] = useState<ExerciseDbExercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<RapidAPIFilters>({});
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  const search = useCallback(
    async (searchQuery: string, pageOffset: number = 0, currentFilters: RapidAPIFilters = filters) => {
      setIsLoading(true);
      setError(null);
      try {
        const response: ExerciseDbResponse = await getRapidAPIExercises(
          searchQuery.trim(),
          currentFilters,
          pageOffset * 25,
          25,
        );

        if (response.success && response.data) {
          if (pageOffset === 0) {
            setExercises(response.data);
          } else {
            setExercises(prev => [...prev, ...response.data]);
          }
          setHasMore((response.metadata?.nextPage ?? null) !== null);
          setCurrentPage(pageOffset);
        } else {
          setError(response.error || 'Failed to fetch exercises');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('RapidAPI search error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [filters],
  );

  // Debounce typing so we don't hammer the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Search when debounced query or filters change.
  useEffect(() => {
    setCurrentPage(0);
    search(debouncedQuery, 0, filters);
  }, [debouncedQuery, filters, search]);

  const updateFilters = useCallback((newFilters: RapidAPIFilters) => {
    setFilters(newFilters);
    setCurrentPage(0);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(0);
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      search(query, currentPage + 1, filters);
    }
  }, [isLoading, hasMore, query, currentPage, filters, search]);

  const setFilterValue = useCallback(
    (filterKey: keyof RapidAPIFilters, values: string[]) => {
      const newFilters = { ...filters };
      if (values.length === 0) {
        delete newFilters[filterKey];
      } else {
        if (filterKey === 'difficulty') {
          newFilters.difficulty = values[0];
        } else {
          newFilters[filterKey as 'bodyParts' | 'equipments' | 'targetMuscles'] = values;
        }
      }
      updateFilters(newFilters);
    },
    [filters, updateFilters],
  );

  return {
    exercises,
    isLoading,
    error,
    query,
    setQuery,
    filters,
    updateFilters,
    clearFilters,
    setFilterValue,
    currentPage,
    hasMore,
    loadMore,
    search,
  };
}
