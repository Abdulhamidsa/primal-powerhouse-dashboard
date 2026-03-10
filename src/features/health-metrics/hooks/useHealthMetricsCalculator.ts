'use client';

import { useState } from 'react';
import type { ApiError } from '@/lib/request';
import { calculateClientHealthMetrics } from '@/features/health-metrics/api/healthMetrics.api';
import type {
  HealthMetricsCalculateResponse,
  HealthMetricsRequestPayload,
} from '@/features/health-metrics/types/healthMetrics.types';

export function useHealthMetricsCalculator(clientId: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const submit = async (payload: HealthMetricsRequestPayload): Promise<HealthMetricsCalculateResponse> => {
    setIsSubmitting(true);
    setError(null);

    try {
      return await calculateClientHealthMetrics(clientId, payload);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      throw apiError;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submit,
    isSubmitting,
    error,
  };
}
