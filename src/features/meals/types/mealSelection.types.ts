export type MealTypeKey = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export type MealMacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MealOption = {
  sourceAssignmentId: string;
  mealType: MealTypeKey;
  portion: number;
  scheduledTime: string | null;
  meal: {
    id: string;
    name: string;
    type: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    imageUrl?: string | null;
    prepTime?: number | null;
    cookTime?: number | null;
    servings?: number | null;
  };
};

export type SelectionItem = {
  mealType: MealTypeKey;
  slotIndex: number;
  mealId: string;
  sourceAssignmentId?: string | null;
  portion: number;
  meal: MealOption['meal'];
};

export type MealOptionsResponse = {
  optionsByType: Record<MealTypeKey, MealOption[]>;
  baselineSelection: SelectionItem[];
  baselineTotals: MealMacroTotals;
  constraints: {
    required: MealTypeKey[];
    snackMax: number;
  };
};

export type MealSelectionResponse = {
  selection: {
    id: string | null;
    name: string;
    items: SelectionItem[];
  };
  baseline: {
    items: SelectionItem[];
    totals: MealMacroTotals;
  };
  selectedTotals: MealMacroTotals;
  delta: MealMacroTotals;
  hasSavedSelection?: boolean;
};

export type SaveMealSelectionInput = {
  name?: string;
  items: Array<{
    mealType: MealTypeKey;
    slotIndex: number;
    mealId: string;
    sourceAssignmentId?: string | null;
  }>;
};

export type SaveMealSelectionResponse = MealSelectionResponse & {
  success: boolean;
};
