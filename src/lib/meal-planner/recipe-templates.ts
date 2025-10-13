import { RecipeTemplate, FoodCategory, MacroContribution } from './types';

/**
 * Sample recipe templates
 */
export const recipeTemplates: RecipeTemplate[] = [
  {
    id: 'chicken-rice-bowl',
    name: 'Chicken Rice Bowl',
    description: 'A balanced meal with a protein source, rice, vegetables, and healthy fats',
    instructions:
      '1. Cook the protein. 2. Prepare the rice. 3. Sauté the vegetables. 4. Combine all ingredients in a bowl. 5. Add sauce and garnish.',
    anchors: [
      {
        id: 'protein-source',
        name: 'Protein Source',
        category: FoodCategory.PROTEIN,
        description: 'Main protein for the bowl',
        required: true,
        defaultFoodId: 'chicken-breast',
        allowedFoodIds: ['chicken-breast', 'beef-lean', 'salmon', 'tofu'],
        defaultQuantity: 150,
        macroContribution: MacroContribution.PRIMARY_PROTEIN,
      },
      {
        id: 'carb-source',
        name: 'Carbohydrate Source',
        category: FoodCategory.CARB,
        description: 'Main carb for the bowl',
        required: true,
        defaultFoodId: 'white-rice',
        allowedFoodIds: ['white-rice', 'brown-rice', 'quinoa', 'sweet-potato'],
        defaultQuantity: 200,
        macroContribution: MacroContribution.PRIMARY_CARB,
      },
      {
        id: 'vegetable-1',
        name: 'Primary Vegetable',
        category: FoodCategory.VEGETABLE,
        description: 'Main vegetable',
        required: true,
        defaultFoodId: 'broccoli',
        allowedFoodIds: ['broccoli', 'spinach', 'bell-pepper'],
        defaultQuantity: 100,
        macroContribution: MacroContribution.MINIMAL,
      },
      {
        id: 'vegetable-2',
        name: 'Secondary Vegetable',
        category: FoodCategory.VEGETABLE,
        description: 'Additional vegetable for variety',
        required: false,
        defaultFoodId: 'bell-pepper',
        allowedFoodIds: ['broccoli', 'spinach', 'bell-pepper'],
        defaultQuantity: 50,
        macroContribution: MacroContribution.MINIMAL,
      },
      {
        id: 'healthy-fat',
        name: 'Healthy Fat',
        category: FoodCategory.FAT,
        description: 'Source of healthy fats',
        required: true,
        defaultFoodId: 'avocado',
        allowedFoodIds: ['olive-oil', 'avocado', 'almonds'],
        defaultQuantity: 30,
        macroContribution: MacroContribution.PRIMARY_FAT,
      },
      {
        id: 'sauce',
        name: 'Sauce',
        category: FoodCategory.CONDIMENT,
        description: 'Flavor enhancer',
        required: false,
        defaultFoodId: 'soy-sauce',
        allowedFoodIds: ['soy-sauce', 'sriracha'],
        defaultQuantity: 10,
        macroContribution: MacroContribution.MINIMAL,
      },
    ],
    tags: ['high-protein', 'balanced', 'lunch', 'dinner'],
    estimatedTimeMinutes: 20,
  },
];
