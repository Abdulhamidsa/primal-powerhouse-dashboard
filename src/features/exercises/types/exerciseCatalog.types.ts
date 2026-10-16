export interface ExerciseCatalogMedia {
  video?: {
    mp4?: Record<string, string | null> | null;
    webm?: Record<string, string | null> | null;
    poster?: string | null;
  } | null;
  gif?: string | null;
  photos?: string[] | null;
}

export interface ExerciseCatalogExercise {
  exerciseId: string;
  providerId: string;
  slug?: string;
  name: string;
  gifUrl: string;
  imageUrl?: string;
  imageUrls?: Record<string, string>;
  videoUrl?: string;
  videoUrls?: string[];
  thumbnailUrl?: string;
  targetMuscles?: string[];
  target?: string | string[];
  bodyParts?: string[];
  bodyPart?: string;
  equipments?: string[];
  equipment?: string;
  secondaryMuscles?: string[];
  instructions?: string[];
  overview?: string;
  category?: string;
  difficultyLevel?: string;
  force?: string;
  mechanic?: string;
  photoUrls?: string[];
}

export interface ExerciseCatalogMetadata {
  totalExercises: number;
  totalPages: number;
  currentPage: number;
  previousPage: string | null;
  nextPage: string | null;
  nextCursor?: string | null;
  nextOffset?: number | null;
  limit?: number;
  provider?: 'workoutx' | 'local';
  providerAvailable?: boolean;
  fallback?: boolean;
}

export interface ExerciseCatalogResponse {
  success: boolean;
  metadata?: ExerciseCatalogMetadata;
  data: ExerciseCatalogExercise[];
  error?: string;
}

export interface ExerciseCatalogSingleResponse {
  success: boolean;
  data?: ExerciseCatalogExercise;
  error?: string;
}

export interface ExerciseCatalogOptionsResponse {
  success: boolean;
  data?: {
    muscles: string[];
    equipments: string[];
    bodyParts: string[];
    categories?: string[];
    difficulties?: string[];
  };
  error?: string;
}

export interface ExerciseCatalogQueryParams {
  offset?: number;
  limit?: number;
  cursor?: string;
  q?: string;
  muscles?: string;
  equipment?: string;
  bodyParts?: string;
  difficulty?: string;
  category?: string;
  sortBy?: 'name' | 'exerciseId' | 'targetMuscles' | 'bodyParts' | 'equipments';
  sortOrder?: 'asc' | 'desc';
}

export type ExerciseDbExercise = ExerciseCatalogExercise;
export type ExerciseDbResponse = ExerciseCatalogResponse;
export type ExerciseDbSingleResponse = ExerciseCatalogSingleResponse;
export type ExerciseDbOptionsResponse = ExerciseCatalogOptionsResponse;
export type ExerciseDbQueryParams = ExerciseCatalogQueryParams;
