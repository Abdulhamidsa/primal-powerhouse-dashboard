export type IngredientMacroRefreshScope = 'all' | 'templates_only';

export type IngredientMacroRefreshRequest = {
  foodId: string;
  scope: IngredientMacroRefreshScope;
  confirm: boolean;
};

export type IngredientMacroRefreshPreviewResponse = {
  success: true;
  mode: 'preview';
  affectedMealsCount: number;
};

export type IngredientMacroRefreshStartedResponse = {
  success: true;
  mode: 'started';
  jobId: string;
  affectedMealsCount: number;
};

export type IngredientMacroRefreshStatusResponse = {
  success: true;
  job: {
    id: string;
    foodId: string;
    status: 'PENDING' | 'RUNNING' | 'READY' | 'FAILED';
    scope: 'ALL' | 'TEMPLATES_ONLY';
    affectedMealsCount: number;
    processedMealsCount: number;
    failedMealsCount: number;
    error: string | null;
    failedMealErrors: Array<{ mealId: string; reason: string }>;
    requestedAt: string;
    startedAt: string | null;
    completedAt: string | null;
    updatedAt: string;
  };
};
