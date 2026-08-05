export interface WorkoutPlanVideo {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  duration: number;
  videoUrl?: string;
  muscleGroups?: string | null;
}

export interface WorkoutPlanExercise {
  id: string;
  workoutPlanId: string;
  videoId: string;
  order: number;
  targetSets: number;
  minReps: number;
  maxReps: number;
  suggestedWeightKg: number | null;
  restSeconds: number;
  notes: string | null;
  video: WorkoutPlanVideo;
}

export interface WorkoutPlanAssignment {
  id: string;
  workoutPlanId: string;
  clientId: string;
  assignedAt: string;
  isActive: boolean;
  client?: { id: string; name: string; avatar: string | null };
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string | null;
  coachId: string;
  createdAt: string;
  updatedAt: string;
  exercises: WorkoutPlanExercise[];
  assignments?: WorkoutPlanAssignment[];
  _count?: { assignments: number };
}

export interface WorkoutPlanAssignmentWithPlan extends WorkoutPlanAssignment {
  sessions?: Array<{ id: string; status: string; completedAt: string | null }>;
  workoutPlan: WorkoutPlan & { exercises: WorkoutPlanExercise[] };
}
