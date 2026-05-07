export interface ExerciseDbExercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles?: string[];
  target?: string | string[];
  bodyParts?: string[];
  bodyPart?: string;
  equipments?: string[];
  equipment?: string;
  secondaryMuscles?: string[];
  instructions?: string[];
}

export interface ExerciseDbMetadata {
  totalExercises: number;
  totalPages: number;
  currentPage: number;
  previousPage: string | null;
  nextPage: string | null;
}

export interface ExerciseDbResponse {
  success: boolean;
  metadata?: ExerciseDbMetadata;
  data: ExerciseDbExercise[];
  error?: string;
  details?: string;
}

export interface ExerciseDbSingleResponse {
  success: boolean;
  data?: ExerciseDbExercise;
  error?: string;
  details?: string;
}

export interface ExerciseDbOptionsResponse {
  success: boolean;
  data?: {
    muscles: string[];
    equipments: string[];
    bodyParts: string[];
  };
  error?: string;
  details?: string;
}

export type ExerciseAudienceFilter = 'all' | 'men' | 'women' | 'unisex';

export interface ExerciseDbQueryParams {
  offset?: number;
  limit?: number;
  q?: string;
  muscles?: string;
  equipment?: string;
  bodyParts?: string;
  sortBy?: 'name' | 'exerciseId' | 'targetMuscles' | 'bodyParts' | 'equipments';
  sortOrder?: 'asc' | 'desc';
}
