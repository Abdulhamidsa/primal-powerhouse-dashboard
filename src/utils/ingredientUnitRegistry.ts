export type IngredientServingUnit = 'piece';

export interface IngredientUnitRegistryItem {
  key: string;
  aliases: string[];
  servingUnit: IngredientServingUnit;
  displayUnitLabel: string;
  gramsPerUnit: number;
}

export const INGREDIENT_UNIT_REGISTRY: IngredientUnitRegistryItem[] = [
  {
    key: 'egg',
    aliases: ['egg', 'eggs', 'egg whole', 'whole egg', 'egg large', 'egg grade a'],
    servingUnit: 'piece',
    displayUnitLabel: 'egg',
    gramsPerUnit: 50,
  },
  {
    key: 'banana',
    aliases: ['banana', 'bananas'],
    servingUnit: 'piece',
    displayUnitLabel: 'banana',
    gramsPerUnit: 118,
  },
  {
    key: 'apple',
    aliases: ['apple', 'apples'],
    servingUnit: 'piece',
    displayUnitLabel: 'apple',
    gramsPerUnit: 182,
  },
  {
    key: 'potato',
    aliases: ['potato', 'potatoes'],
    servingUnit: 'piece',
    displayUnitLabel: 'potato',
    gramsPerUnit: 173,
  },
  {
    key: 'bread-slice',
    aliases: ['bread slice', 'slice bread', 'sliced bread'],
    servingUnit: 'piece',
    displayUnitLabel: 'slice',
    gramsPerUnit: 28,
  },
  {
    key: 'whole-wheat-tortilla',
    aliases: [
      'tortillas ready to bake or fry whole wheat',
      'tortilla whole wheat',
      'whole wheat tortilla',
      'whole wheat tortillas',
      'tortilla wrap',
      'wrap tortilla',
    ],
    servingUnit: 'piece',
    displayUnitLabel: 'wrap',
    gramsPerUnit: 45,
  },
];
