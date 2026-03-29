export type MealPromptInput = {
  mealName: string;
  ingredients: string[];
  spices?: string[];
};

export type MealPromptOutput = {
  positivePrompt: string;
  negativePrompt: string;
  fullPrompt: string;
};
