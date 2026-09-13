export type TrainingSet = {
  id: string;
  setNumber: number;
  plannedReps: number;
  plannedWeightKg: number | null;
  actualReps: number | null;
  actualWeightKg: number | null;
  completed: boolean;
  skipped: boolean;
  feedback: string | null;
};
export type SessionExercise = {
  id: string;
  exerciseNameSnapshot: string;
  notesSnapshot: string | null;
  plannedRestSeconds: number;
  exercise: { id: string; videoUrl: string | null; instructions: string | null } | null;
  sets: TrainingSet[];
};
export type TrainingSession = {
  id: string;
  status: string;
  startedAt: string;
  exercises: SessionExercise[];
  overallFeedback: string | null;
  perceivedDifficulty: string | null;
  planDay: { title: string | null };
};
export type TrainingDay = {
  id: string;
  title: string | null;
  date: string;
  type: string;
  status: string;
  note: string | null;
  workoutTemplate: {
    name: string;
    exercises: { id: string; sets: number; reps: number; exercise: { name: string } }[];
  } | null;
  latestSession?: { id: string; status: string } | null;
};
export type TrainingPlan = { id: string; name: string; description: string | null; days: TrainingDay[] };
export type WorkoutExercise = {
  id: string;
  targetSets: number;
  minReps: number;
  maxReps: number;
  suggestedWeightKg: number | null;
  restSeconds: number;
  notes: string | null;
  video: { title: string; videoUrl?: string; thumbnailUrl?: string | null };
};
export type WorkoutAssignment = {
  id: string;
  workoutPlan: { name: string; description: string | null; exercises: WorkoutExercise[] };
  sessions?: { id: string; status: string }[];
};
export type AssignedVideo = {
  id: string;
  isCompleted: boolean;
  video: { title: string; description: string | null; videoUrl: string; thumbnailUrl: string | null };
};
export type AssignedVideoDetail = z.infer<typeof assignedVideoDetailSchema>;
export type LegacyDraft = {
  sessionId: string;
  logs: Record<
    string,
    {
      planExerciseId: string;
      completedAt: string | null;
      feedback: 'TOO_EASY' | 'FELT_GOOD' | 'TOO_HEAVY' | 'FORM_ISSUE' | 'PAIN_DISCOMFORT' | null;
      feedbackNote: string | null;
      sets: { reps: number; weightKg: number; completed: boolean }[];
    }
  >;
};
import type { z } from 'zod';
import type { assignedVideoDetailSchema } from '../schemas/training.schema';
