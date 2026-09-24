'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { COACHING_INTEREST_URL, getCoachingInterest, requestCoachingInterest } from '@/features/coaching-interest/api/coachingInterest.api';
import type { CoachingInterestResponse } from '@/features/coaching-interest/types/coachingInterest.types';
import type { ApiError } from '@/lib/request';

export function useCoachingInterest(enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<CoachingInterestResponse, ApiError>(enabled ? COACHING_INTEREST_URL : null, getCoachingInterest, {
    revalidateOnFocus: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submit = async () => {
    if (isSubmitting || data?.requested) return data;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await requestCoachingInterest();
      await mutate(response, false);
      return response;
    } catch (requestError) {
      const message = requestError && typeof requestError === 'object' && 'message' in requestError ? String(requestError.message) : 'Could not send your request. Please try again.';
      setSubmitError(message);
      return undefined;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { interest: data ?? null, isLoading, error, isSubmitting, submitError, submit };
}
