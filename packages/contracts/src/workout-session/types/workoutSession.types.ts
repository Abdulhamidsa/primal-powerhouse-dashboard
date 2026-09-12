export type WorkoutSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
export type ExerciseFeedbackType = 'TOO_EASY' | 'FELT_GOOD' | 'TOO_HEAVY' | 'FORM_ISSUE' | 'PAIN_DISCOMFORT';

export interface SetLogInput {
  reps: number;
  weightKg: number;
  completed: boolean;
}

export interface ExerciseLogInput {
  planExerciseId: string;
  completedAt: string | null;
  feedback: ExerciseFeedbackType | null;
  feedbackNote: string | null;
  sets: SetLogInput[];
}

export interface CompleteSessionInput {
  status: 'COMPLETED' | 'ABANDONED';
  exerciseLogs: ExerciseLogInput[];
}

// Local in-session state (never persisted mid-session)

export interface LocalSetEntry {
  reps: number;
  weightKg: number;
  completed: boolean;
}

export interface LocalExerciseState {
  planExerciseId: string;
  sets: LocalSetEntry[];
  feedback: ExerciseFeedbackType | null;
  feedbackNote: string | null;
  done: boolean;
}

export interface WorkoutSession {
  id: string;
  clientId: string;
  planAssignmentId: string;
  status: WorkoutSessionStatus;
  startedAt: string;
  completedAt: string | null;
}
