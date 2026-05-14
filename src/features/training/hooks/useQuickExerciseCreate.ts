'use client';

import { useCallback, useState } from 'react';
import { createExercise } from '../api/coachTraining.api';
import { uploadExerciseMedia } from '../api/exerciseMedia.api';
import type { QuickExerciseCreateInput } from '../schemas/quickExercise.schemas';
import type { CreateExerciseInput } from '../schemas/exercise.schemas';

export type QuickExerciseFormInput = QuickExerciseCreateInput & {
  mediaFile: File;
};

const DEFAULT_MUSCLE_GROUP: CreateExerciseInput['muscleGroup'] = 'CORE';
const DEFAULT_EQUIPMENT: CreateExerciseInput['equipment'] = 'BODYWEIGHT';

export function useQuickExerciseCreate() {
  const [isUploading, setIsUploading] = useState(false);

  const createQuickExercise = useCallback(async (input: QuickExerciseFormInput) => {
    setIsUploading(true);
    try {
      const uploadResponse = await uploadExerciseMedia(input.mediaFile);
      const mediaUrl = uploadResponse.data.url;
      const isVideo = uploadResponse.data.resourceType === 'video' || input.mediaKind === 'VIDEO';

      const exercisePayload: CreateExerciseInput = {
        name: input.name,
        description: input.description ?? null,
        muscleGroup: DEFAULT_MUSCLE_GROUP,
        muscleGroupSecondary: null,
        equipment: DEFAULT_EQUIPMENT,
        videoUrl: isVideo ? mediaUrl : null,
        imageUrl: isVideo ? null : mediaUrl,
        instructions: null,
        defaultSets: null,
        defaultReps: null,
        defaultRestSeconds: null,
      };

      return await createExercise(exercisePayload);
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    createQuickExercise,
    isUploading,
  };
}
