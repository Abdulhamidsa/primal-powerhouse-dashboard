import { useMemo, useState } from 'react';
import useSWR from 'swr';
import type { ApiError } from '@/lib/request';
import {
  getUserTrainingCoach,
  getUserTrainingVideos,
  USER_TRAINING_COACH_URL,
  USER_TRAINING_VIDEOS_URL,
} from '@/features/training/api/userTraining.api';

export function useUserTraining() {
  const [selectedTag, setSelectedTag] = useState('all');

  const videosSWR = useSWR(USER_TRAINING_VIDEOS_URL, getUserTrainingVideos);
  const coachSWR = useSWR(USER_TRAINING_COACH_URL, getUserTrainingCoach);

  const assignments = videosSWR.data ?? [];

  const allTags = useMemo(
    () => Array.from(new Set(assignments.flatMap(a => (Array.isArray(a.video.tags) ? a.video.tags : [])))),
    [assignments]
  );

  const filteredAssignments = useMemo(() => {
    if (selectedTag === 'all') return assignments;
    return assignments.filter(a => Array.isArray(a.video.tags) && a.video.tags.includes(selectedTag));
  }, [assignments, selectedTag]);

  const isLoading = videosSWR.isLoading;
  const error = videosSWR.error as ApiError | undefined;

  return {
    selectedTag,
    setSelectedTag,
    assignments,
    filteredAssignments,
    allTags,
    coachInfo: coachSWR.data?.coach ?? null,
    isLoading,
    error,
    refresh: async () => {
      await Promise.all([videosSWR.mutate(), coachSWR.mutate()]);
    },
  };
}
