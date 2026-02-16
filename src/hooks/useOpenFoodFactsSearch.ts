/**
 * Hook for searching ingredients via USDA FoodData Central
 * Includes debouncing and caching
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { OpenFoodFactsService } from '@/services/openFoodFactsService';
import type { FoodItem } from '@/types/openFoodFacts';

interface UseOpenFoodFactsSearchState {
  results: FoodItem[];
  isLoading: boolean;
  error: string | null;
}

const DEBOUNCE_DELAY = 400; // milliseconds
const MIN_QUERY_LENGTH = 3; // USDA requirement

export function useOpenFoodFactsSearch() {
  const [state, setState] = useState<UseOpenFoodFactsSearchState>({
    results: [],
    isLoading: false,
    error: null,
  });

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastQuery = useRef<string>('');

  // Perform actual search
  const performSearch = useCallback(
    async (
      query: string,
      includeBranded: boolean,
      filters?: {
        allowedCategories?: string[];
        excludedNameTerms?: string[];
        allowedDataTypes?: Array<'Foundation' | 'SR Legacy'>;
        form?: 'raw' | 'dry' | 'cooked' | 'processed' | 'all';
      }
    ) => {
      if (!query.trim()) {
        setState({
          results: [],
          isLoading: false,
          error: null,
        });
        return;
      }

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const results = await OpenFoodFactsService.searchFoods(query, undefined, {
          includeBranded,
          allowedCategories: filters?.allowedCategories,
          excludedNameTerms: filters?.excludedNameTerms,
          allowedDataTypes: filters?.allowedDataTypes,
          form: filters?.form,
        });

        setState({
          results,
          isLoading: false,
          error: results.length === 0 ? 'No ingredients found' : null,
        });
      } catch (err) {
        setState({
          results: [],
          isLoading: false,
          error: err instanceof Error ? err.message : 'Search failed',
        });
      }
    },
    []
  );

  // Debounced search
  const search = useCallback(
    (
      query: string,
      options?: {
        includeBranded?: boolean;
        allowedCategories?: string[];
        excludedNameTerms?: string[];
        allowedDataTypes?: Array<'Foundation' | 'SR Legacy'>;
        form?: 'raw' | 'dry' | 'cooked' | 'processed' | 'all';
      }
    ) => {
      OpenFoodFactsService.clearCaches();
      lastQuery.current = query;
      const includeBranded = options?.includeBranded ?? false;

      // Clear existing timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Require minimum length for USDA
      const trimmedQuery = query.trim();
      if (!trimmedQuery || trimmedQuery.length < MIN_QUERY_LENGTH) {
        setState({
          results: [],
          isLoading: false,
          error: trimmedQuery.length > 0 ? `Enter at least ${MIN_QUERY_LENGTH} characters` : null,
        });
        return;
      }

      // Set loading state immediately
      setState(prev => ({ ...prev, isLoading: true }));

      // Debounce the actual search
      debounceTimer.current = setTimeout(() => {
        performSearch(query, includeBranded, {
          allowedCategories: options?.allowedCategories,
          excludedNameTerms: options?.excludedNameTerms,
          allowedDataTypes: options?.allowedDataTypes,
          form: options?.form,
        });
      }, DEBOUNCE_DELAY);
    },
    [performSearch]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    results: state.results,
    isLoading: state.isLoading,
    error: state.error,
    search,
    clearResults: () =>
      setState({
        results: [],
        isLoading: false,
        error: null,
      }),
  };
}
