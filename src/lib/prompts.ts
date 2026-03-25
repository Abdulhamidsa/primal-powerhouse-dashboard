import type { GenerateMealsInput } from '@/types/meal';

export function buildMealPrompt(input: GenerateMealsInput): string {
  const mealCount = input.mealCount ?? 5;

  return `
You are an expert chef and creative meal planner. Your job is to generate a large, diverse, and creative set of meal templates for a fitness meal planner.

Generate ${mealCount} different ${input.type} meals. Be as creative and varied as possible, while keeping meals realistic and appetizing.

Requirements:
- Each meal must be a real, appetizing, and sensible meal that people would actually want to eat.
- Focus on quality and variety: meals should make sense, taste good, and be practical to prepare, but do NOT repeat the same ideas or combinations.
- Use only realistic, common ingredients (no fantasy or random foods), but be creative in combining them.
- Meals should be highly diverse, with different cuisines, proteins, and preparation styles.
- Do NOT include alcohol, candy, desserts, cookies, cake, baby food, sauces, dressings, takeaway, pizza, burgers, or anything unrealistic.
- Return ingredients as plain food names with grams.
- Do not return nutritional values, explanations, or markdown.

Return only valid JSON in this exact format:

{
  "meals": [
    {
      "name": "Meal name",
      "ingredients": [
        { "name": "chicken breast", "grams": 150 },
        { "name": "rice", "grams": 120 }
      ]
    }
  ]
}
`.trim();
}

export function buildMealImagePrompt(mealName: string, ingredients: string[]): string {
  return `
Realistic food photography of ${mealName}.
Main ingredients: ${ingredients.join(', ')}.
One serving only.
Natural lighting.
Clean plate presentation.
Home kitchen or neutral food photography background.
High detail, realistic, appetizing.
`.trim();
}
