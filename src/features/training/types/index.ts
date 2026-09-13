import type {
  Exercise,
  WorkoutTemplate,
  WorkoutTemplateExercise,
  ClientTrainingPlan,
  TrainingPlanDay,
  TrainingSession,
  TrainingSessionExercise,
  TrainingSessionSet,
  RestTimer,
} from '@prisma/client';

// Export Prisma types directly
export type ExerciseModel = Exercise;
export type WorkoutTemplateModel = WorkoutTemplate;
export type WorkoutTemplateExerciseModel = WorkoutTemplateExercise;
export type ClientTrainingPlanModel = ClientTrainingPlan;
export type TrainingPlanDayModel = TrainingPlanDay;
export type TrainingSessionModel = TrainingSession;
export type TrainingSessionExerciseModel = TrainingSessionExercise;
export type TrainingSessionSetModel = TrainingSessionSet;
export type RestTimerModel = RestTimer;

// Extended types for API responses

export interface ExerciseWithCoach extends Exercise {
  coach: {
    id: string;
    name: string;
    email: string;
  };
}

export interface WorkoutTemplateWithExercises extends WorkoutTemplate {
  exercises: WorkoutTemplateExerciseWithExercise[];
  coach?: {
    id: string;
    name: string;
  };
}

// Lighter version of template (used in nested queries where coach isn't included)
export interface WorkoutTemplateBasic extends WorkoutTemplate {
  exercises: WorkoutTemplateExerciseWithExercise[];
}

export interface WorkoutTemplateExerciseWithExercise extends WorkoutTemplateExercise {
  exercise: Exercise;
}

export interface ClientTrainingPlanWithDays extends ClientTrainingPlan {
  days: TrainingPlanDayWithTemplate[];
  client: {
    id: string;
    name: string;
  };
}

export interface TrainingPlanDayWithTemplate extends TrainingPlanDay {
  workoutTemplate: WorkoutTemplateBasic | null;
}

export interface TrainingSessionWithExercises extends TrainingSession {
  exercises: TrainingSessionExerciseWithSets[];
  planDay: TrainingPlanDayWithTemplate;
}

export interface TrainingSessionExerciseWithSets extends TrainingSessionExercise {
  sets: TrainingSessionSet[];
  exercise: Exercise | null;
}

export interface TrainingPreviousPerformanceSet {
  setNumber: number;
  reps: number | null;
  weight: number | null;
  feedback: string | null;
}

export interface TrainingPreviousPerformance {
  exerciseName: string;
  sets: TrainingPreviousPerformanceSet[];
}
