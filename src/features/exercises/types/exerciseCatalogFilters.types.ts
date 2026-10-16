export interface ExerciseCatalogFilterOptions {
  bodyParts: string[];
  equipments: string[];
  targetMuscles: string[];
  difficulties: string[];
}

export interface ExerciseCatalogFilters {
  bodyParts?: string[];
  equipments?: string[];
  targetMuscles?: string[];
  difficulty?: string;
}
