export type MealTypeKey = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export type SideTypeKey = 'LUNCH' | 'DINNER';

export type SideSelectionOption = {
  id: string;
  name: string;
  type: 'SALAD' | 'SOUP';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number | null;
  imageUrl?: string | null;
  ingredients: string[];
  spices: string[];
  instructions: string[];
  foodOrigin?: string | null;
};

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
  side?: SideSelectionOption | null;
  meal: {
    id: string;
    name: string;
    type: string;
    description?: string | null;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients?: string | null;
    instructions?: string | null;
    category?: string | null;
    difficulty?: string | null;
    imageUrl?: string | null;
    prepTime?: number | null;
    cookTime?: number | null;
    servings?: number | null;
    tags?: string | null;
  };
};

export type SelectionItem = {
  mealType: MealTypeKey;
  slotIndex: number;
  mealId: string;
  sourceAssignmentId?: string | null;
  portion: number;
  side?: SideSelectionOption | null;
  meal: MealOption['meal'];
};

export type SideProgramOption = {
  sourceAssignmentId: string;
  sourceMealType: SideTypeKey;
  meal: MealOption['meal'];
  portion: number;
  scheduledTime: string | null;
  side: SideSelectionOption;
};

export type MealOptionsResponse = {
  optionsByType: Record<MealTypeKey, MealOption[]>;
  baselineSelection: SelectionItem[];
  baselineTotals: MealMacroTotals;
  coachTargets?: MealMacroTotals | null;
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
  coachTargets?: MealMacroTotals | null;
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
