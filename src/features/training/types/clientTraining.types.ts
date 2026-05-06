import type {
  TrainingDayType,
  PlanDayStatus,
  PlanStatus,
  SessionStatus,
  PerceivedDifficulty,
} from '../enums/training.enums';
import type { TrainingPreviousPerformance, TrainingSessionExerciseWithSets } from './index';

export type TrainingTemplateExerciseDTO = {
  id: string;
  order: number;
  sets: number;
  reps: number;
  restSeconds: number;
  targetRpe: number | null;
  targetTempo: string | null;
  notes: string | null;
  exercise: {
    id: string;
    name: string;
    description: string | null;
    muscleGroup: string;
    muscleGroupSecondary: string | null;
    equipment: string | null;
    videoUrl: string | null;
    imageUrl: string | null;
    instructions: string | null;
    defaultSets: number | null;
    defaultReps: number | null;
    defaultRestSeconds: number | null;
  };
};

export type TrainingTemplateDTO = {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  difficulty: string | null;
  exercises: TrainingTemplateExerciseDTO[];
};

export type TrainingPlanDayDTO = {
  id: string;
  date: string;
  type: TrainingDayType;
  title: string | null;
  note: string | null;
  status: PlanDayStatus;
  workoutTemplateId: string | null;
  workoutTemplate: TrainingTemplateDTO | null;
};

export type TrainingPlanDTO = {
  id: string;
  name: string;
  description: string | null;
  status: PlanStatus;
  startDate: string;
  endDate: string | null;
  client: {
    id: string;
    name: string;
  };
  days: TrainingPlanDayDTO[];
};

export type TrainingPlanDayLookupDTO = {
  planId: string;
  day: TrainingPlanDayDTO;
};

export type TrainingSessionSetDTO = {
  id: string;
  setNumber: number;
  plannedReps: number;
  plannedWeightKg: number | null;
  plannedRestSeconds: number;
  actualReps: number | null;
  actualWeightKg: number | null;
  completed: boolean;
  skipped: boolean;
  feedback: string | null;
};

export type TrainingSessionExerciseDTO = TrainingSessionExerciseWithSets & {
  sets: TrainingSessionSetDTO[];
};

export type TrainingSessionDTO = {
  id: string;
  status: SessionStatus;
  startedAt: string;
  completedAt: string | null;
  planDayId: string;
  clientId: string;
  workoutTemplateId: string | null;
  perceivedDifficulty: PerceivedDifficulty | null;
  overallFeedback: string | null;
  caloriesBurned: number | null;
  exercises: TrainingSessionExerciseDTO[];
  planDay: TrainingPlanDayDTO;
};

export type TrainingHistoryDTO = TrainingSessionDTO[];

export type TrainingPreviousPerformanceDTO = TrainingPreviousPerformance | null;
