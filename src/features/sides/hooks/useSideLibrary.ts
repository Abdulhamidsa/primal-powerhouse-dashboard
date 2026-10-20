'use client';

import { useState } from 'react';
import useSWR from 'swr';
import type { ApiError } from '@/lib/fetcher';
import { createSide, generateSide, listSides } from '@/features/sides/api/sides.api';
import type { CreateSideInput, GenerateSideInput, SideItem } from '@/features/sides/types/side.types';

const SIDES_URL = '/api/sides';

export function useSideLibrary() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<SideItem[], ApiError>(SIDES_URL, listSides, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    dedupingInterval: 60_000,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sides = data ?? [];

  const loadSides = async () => {
    if (data !== undefined) return data;
    return (await mutate()) ?? [];
  };

  const submitCreateSide = async (payload: CreateSideInput) => {
    setIsSubmitting(true);
    try {
      const createdSide = await createSide(payload);
      await mutate(current => [createdSide, ...(current ?? []).filter(side => side.id !== createdSide.id)], false);
      return createdSide;
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitGenerateSide = async (payload: GenerateSideInput) => {
    setIsSubmitting(true);
    try {
      const createdSide = await generateSide(payload);
      await mutate(current => [createdSide, ...(current ?? []).filter(side => side.id !== createdSide.id)], false);
      return createdSide;
    } finally {
      setIsSubmitting(false);
    }
  };

  const setSides = (nextSides: SideItem[]) => {
    void mutate(nextSides, false);
  };

  return {
    sides,
    error,
    isLoading,
    isSubmitting,
    isValidating,
    loadSides,
    createSide: submitCreateSide,
    generateSide: submitGenerateSide,
    setSides,
  };
}
