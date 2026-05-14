export interface RapidAPIFilterOptions {
  bodyParts: string[];
  equipments: string[];
  targetMuscles: string[];
  difficulties: string[];
}

export interface RapidAPIFilters {
  bodyParts?: string[];
  equipments?: string[];
  targetMuscles?: string[];
  difficulty?: string;
}

export interface FilterOptionsResponse {
  success: boolean;
  data?: RapidAPIFilterOptions;
  error?: string;
  details?: string;
}
