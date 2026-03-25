export interface GeneratedIngredientContribution {
  mealName: string;
  grams: number;
}

export interface GeneratedIngredientTotal {
  key: string;
  label: string;
  totalGrams: number;
  contributors: GeneratedIngredientContribution[];
}
