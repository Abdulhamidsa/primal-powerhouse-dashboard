'use client';

import { useCallback, useState } from 'react';
import { createSide, generateSide, listSides } from '@/features/sides/api/sides.api';
import type { CreateSideInput, GenerateSideInput, SideItem } from '@/features/sides/types/side.types';

export function useSideLibrary() {
  const [sides, setSides] = useState<SideItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSides = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextSides = await listSides();
      setSides(nextSides);
      return nextSides;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitCreateSide = useCallback(async (payload: CreateSideInput) => {
    setIsSubmitting(true);
    try {
      const createdSide = await createSide(payload);
      setSides(prev => [createdSide, ...prev.filter(side => side.id !== createdSide.id)]);
      return createdSide;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const submitGenerateSide = useCallback(async (payload: GenerateSideInput) => {
    setIsSubmitting(true);
    try {
      const createdSide = await generateSide(payload);
      setSides(prev => [createdSide, ...prev.filter(side => side.id !== createdSide.id)]);
      return createdSide;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    sides,
    isLoading,
    isSubmitting,
    loadSides,
    createSide: submitCreateSide,
    generateSide: submitGenerateSide,
    setSides,
  };
}
