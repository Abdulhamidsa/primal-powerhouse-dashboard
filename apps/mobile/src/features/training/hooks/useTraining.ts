import { useRestTimer } from './useRestTimer';
import { updateWorkoutSet } from '../api/workoutDraft';
import { useConnection } from '@/features/resources/hooks/useConnection';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAction, useDraft, useResource } from '@/features/resources/hooks/useResource';
import * as api from '../api/training.api';
import {
  updateSetSchema,
  completeTrainingSessionSchema,
  startTrainingSessionSchema,
  completeSessionSchema,
} from '../schemas/training.schema';
import type { LegacyDraft, TrainingSet } from '../types/training.types';
export function useTraining() {
  const { offline } = useConnection();
  const [showVideos, setShowVideos] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const plan = useResource('/api/user/training/plan', api.getPlan);
  const assignments = useResource('/api/user/workout-assignments', api.getAssignments);
  const videos = useResource(showVideos ? '/api/user/videos' : null, api.getVideos);
  const history = useResource(showHistory ? '/api/user/training/history' : null, api.getHistory);
  const action = useAction([
    '/api/user/training',
    '/api/user/workout-assignments',
    '/api/user/workout-sessions',
    '/api/user/videos',
  ]);
  const router = useRouter();
  const refresh = async () => {
    await Promise.all([
      plan.refresh(),
      assignments.refresh(),
      showVideos ? videos.refresh() : Promise.resolve(),
      showHistory ? history.refresh() : Promise.resolve(),
    ]);
  };
  return {
    offline,
    plan,
    assignments,
    videos,
    history,
    action,
    showVideos,
    setShowVideos,
    showHistory,
    setShowHistory,
    refresh,
    refreshing:
      plan.isValidating ||
      assignments.isValidating ||
      (showVideos && videos.isValidating) ||
      (showHistory && history.isValidating),
    start: (planDayId: string) =>
      action.run(async () => {
        const session = await api.startTraining(startTrainingSessionSchema.parse({ planDayId }));
        router.push({ pathname: '/session/[id]', params: { id: session.id } });
      }),
    openSession: (id: string) => router.push({ pathname: '/session/[id]', params: { id } }),
    openWorkout: (id: string) => router.push({ pathname: '/workout/[id]', params: { id } }),
    openVideo: (id: string) => router.push({ pathname: '/video/[id]', params: { id } }),
    skip: (id: string) => action.run(() => api.skipDay(id)),
    completeVideo: (id: string) => action.run(() => api.completeVideo(id)),
  };
}
export function useAssignedVideo(id: string) {
  const { offline } = useConnection();
  const video = useResource(id ? `/api/user/videos/${id}` : null, () => api.getVideo(id));
  const action = useAction(['/api/user/videos']);
  return {
    offline,
    video,
    action,
    complete: () => action.run(() => api.completeVideo(id)),
  };
}
export function useTrainingSession(id: string) {
  const { offline } = useConnection();
  const session = useResource(`/api/user/training/sessions/${id}`, () => api.getSession(id));
  const action = useAction([
    '/api/user/training',
    '/api/user/workout-assignments',
    '/api/user/workout-sessions',
    '/api/user/videos',
  ]);
  const draft = useDraft(`session-feedback:${id}`, { overallFeedback: '', perceivedDifficulty: 'GOOD' });
  return {
    offline,
    session,
    action,
    draft,
    finish: (status: 'COMPLETED' | 'ABANDONED') =>
      action.run(async () => {
        const result = await api.finishTraining(
          id,
          completeTrainingSessionSchema.parse({ ...draft.value, status }),
        );
        draft.setValue({ overallFeedback: '', perceivedDifficulty: 'GOOD' });
        return result;
      }),
  };
}
export function useSet(sessionId: string, set: TrainingSet, restSeconds: number) {
  const { offline } = useConnection();
  const draft = useDraft(`set:${sessionId}:${set.id}`, {
    reps: String(set.actualReps ?? set.plannedReps),
    weight: String(set.actualWeightKg ?? set.plannedWeightKg ?? 0),
    feedback: set.feedback ?? '',
  });
  const rest = useRestTimer(`${sessionId}:${set.id}`);
  const action = useAction([
    '/api/user/training',
    '/api/user/workout-assignments',
    '/api/user/workout-sessions',
    '/api/user/videos',
  ]);
  return {
    offline,
    draft,
    action,
    remaining: rest.remaining,
    skipRest: rest.skip,
    save: (skipped = false) =>
      action.run(async () => {
        const result = await api.saveSet(
          sessionId,
          set.id,
          updateSetSchema.parse({
            actualReps: Number(draft.value.reps),
            actualWeightKg: Number(draft.value.weight),
            feedback: draft.value.feedback,
            completed: !skipped,
            skipped,
          }),
        );
        if (skipped) rest.skip();
        else rest.start(restSeconds);
        return result;
      }),
  };
}
export function useWorkout(id: string) {
  const { offline } = useConnection();
  const assignments = useResource('/api/user/workout-assignments', api.getAssignments);
  const assignment = assignments.data?.find(a => a.id === id);
  const draft = useDraft<LegacyDraft>(`workout:${id}`, { sessionId: '', logs: {} });
  const action = useAction([
    '/api/user/training',
    '/api/user/workout-assignments',
    '/api/user/workout-sessions',
    '/api/user/videos',
  ]);
  const rest = useRestTimer(`workout:${id}:${draft.value.sessionId}`);
  const setNumber = (exerciseId: string, index: number, field: 'reps' | 'weightKg', value: string) => {
    const number = Number(value);
    if (Number.isFinite(number) && number >= 0)
      draft.setValue(old => updateWorkoutSet(old, exerciseId, index, { [field]: number }, Date.now()));
  };
  const toggleSet = (exerciseId: string, index: number) => {
    const done = !draft.value.logs[exerciseId]?.sets[index]?.completed;
    draft.setValue(old => updateWorkoutSet(old, exerciseId, index, { completed: done }, Date.now()));
    if (done) rest.start(assignment?.workoutPlan.exercises.find(e => e.id === exerciseId)?.restSeconds ?? 0);
    else rest.skip();
  };
  const setFeedback = (exerciseId: string, note: string) =>
    draft.setValue(old => ({
      ...old,
      logs: { ...old.logs, [exerciseId]: { ...old.logs[exerciseId], feedbackNote: note } },
    }));
  const start = (restart = false) =>
    action.run(async () => {
      const session = await api.startWorkout(id, restart);
      draft.setValue(old => ({
        sessionId: session.id,
        logs:
          old.sessionId === session.id
            ? old.logs
            : Object.fromEntries(
                (assignment?.workoutPlan.exercises ?? []).map(e => [
                  e.id,
                  {
                    planExerciseId: e.id,
                    completedAt: null,
                    feedback: null,
                    feedbackNote: null,
                    sets: Array.from({ length: e.targetSets }, () => ({
                      reps: e.minReps,
                      weightKg: e.suggestedWeightKg ?? 0,
                      completed: false,
                    })),
                  },
                ]),
              ),
      }));
      return session;
    });
  return {
    offline,
    rest,
    setNumber,
    toggleSet,
    setFeedback,
    assignments,
    assignment,
    draft,
    action,
    start,
    finish: (status: 'COMPLETED' | 'ABANDONED') =>
      action.run(async () => {
        const result = await api.finishWorkout(
          draft.value.sessionId,
          completeSessionSchema.parse({ status, exerciseLogs: Object.values(draft.value.logs) }),
        );
        rest.skip();
        draft.setValue({ sessionId: '', logs: {} });
        return result;
      }),
  };
}
