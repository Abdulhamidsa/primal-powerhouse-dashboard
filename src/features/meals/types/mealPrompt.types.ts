export type MealPromptInput = {
  mealName: string;
  ingredients: string[];
};

export type MealPromptOutput = {
  positivePrompt: string;
  negativePrompt: string;
  fullPrompt: string;
};
