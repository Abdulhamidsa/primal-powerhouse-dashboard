'use client';

import { useEffect, useState } from 'react';
import {
  getIngredientMacroRefreshStatus,
  previewIngredientMacroRefresh,
  startIngredientMacroRefresh,
} from '@/features/ingredient-macro-refresh/api/ingredientMacroRefresh.api';
import type { IngredientMacroRefreshScope, IngredientMacroRefreshStatusResponse } from '@/features/ingredient-macro-refresh/types/refresh.types';

export function useIngredientMacroRefresh() {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<IngredientMacroRefreshStatusResponse['job'] | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!jobId) return;
    const currentJobId = jobId;

    let timer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    async function poll() {
      try {
        const response = await getIngredientMacroRefreshStatus(currentJobId);
        if (stopped) return;

        setStatus(response.job);
        setError('');

        if (response.job.status === 'READY' || response.job.status === 'FAILED') {
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
        }
      } catch (pollError) {
        if (stopped) return;
        setError(pollError instanceof Error ? pollError.message : 'Failed to fetch refresh status');
      }
    }

    void poll();
    timer = setInterval(() => {
      void poll();
    }, 1500);

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
  }, [jobId]);

  const preview = async (foodId: string, scope: IngredientMacroRefreshScope) => {
    setIsPreviewing(true);
    setError('');

    try {
      const response = await previewIngredientMacroRefresh({ foodId, scope });
      return response.affectedMealsCount;
    } catch (previewError) {
      const message = previewError instanceof Error ? previewError.message : 'Failed to preview affected meals';
      setError(message);
      throw previewError;
    } finally {
      setIsPreviewing(false);
    }
  };

  const start = async (foodId: string, scope: IngredientMacroRefreshScope) => {
    setIsStarting(true);
    setError('');

    try {
      const response = await startIngredientMacroRefresh({ foodId, scope });
      setJobId(response.jobId);
      return response;
    } catch (startError) {
      const message = startError instanceof Error ? startError.message : 'Failed to start refresh job';
      setError(message);
      throw startError;
    } finally {
      setIsStarting(false);
    }
  };

  const reset = () => {
    setJobId(null);
    setStatus(null);
    setError('');
  };

  return {
    isPreviewing,
    isStarting,
    jobId,
    status,
    error,
    preview,
    start,
    reset,
  };
}
