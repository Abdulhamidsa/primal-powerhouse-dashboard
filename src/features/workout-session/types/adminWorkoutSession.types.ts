export type AdminSetLog = {
  id: string;
  setNumber: number;
  reps?: number | null;
  weightKg?: number | null;
  completed: boolean;
  loggedAt?: string | null;
};

export type AdminExerciseLog = {
  id: string;
  planExerciseId?: string | null;
  name: string;
  target?: string | null;
  completedAt?: string | null;
  feedback?: string | null;
  feedbackNote?: string | null;
  sets: AdminSetLog[];
};

export type AdminWorkoutSessionListItem = {
  id: string;
  clientId: string;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  performedBy?: { id: string; name?: string | null } | null;
  summary?: string | null;
  reviewed?: boolean;
  reviewedAt?: string | null;
};

export type AdminWorkoutSessionListResponse = {
  sessions: AdminWorkoutSessionListItem[];
  total?: number;
};

export type AdminWorkoutSessionDetail = {
  id: string;
  clientId: string;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  performedBy?: { id: string; name?: string | null } | null;
  exercises: AdminExerciseLog[];
  notes?: string | null;
  photos?: string[] | null;
  reviewed?: boolean;
  reviewedAt?: string | null;
};
