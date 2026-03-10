'use client';

import { useState } from 'react';
import type { ApiError } from '@/lib/request';
import { saveClientHealthMetricsNotes } from '@/features/health-metrics/api/healthMetrics.api';

export function useHealthMetricsNotes(clientId: string) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const saveNotes = async (notes: string[]): Promise<string[]> => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await saveClientHealthMetricsNotes(clientId, notes);
      return result.notes;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      throw apiError;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveNotes,
    isSaving,
    error,
  };
}
