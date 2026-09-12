import { expect, it } from 'vitest';
import { checkShoppingItems, shoppingListText } from './shoppingPresentation';
import { totalsFromSelectionItems } from '@primal/contracts/meals/lib/mealSelectionPlanner';

it('keeps grocery quantities when copying or sharing', () => {
  expect(
    shoppingListText([
      { key: 'carbs', title: 'Carbs', items: [{ id: 'oats', label: 'Oats', quantity: '75g', source: 'ingredient' }] },
    ]),
  ).toBe('CARBS\n- 75g Oats');
});
it('checks and unchecks one section without losing another section', () => {
  expect(checkShoppingItems(['milk'], ['oats', 'rice'], true)).toEqual(['milk', 'oats', 'rice']);
  expect(checkShoppingItems(['milk', 'oats', 'rice'], ['oats', 'rice'], false)).toEqual(['milk']);
});
it('matches website nutrition for assigned portions and sides', () => {
  expect(
    totalsFromSelectionItems([
      {
        mealType: 'LUNCH',
        slotIndex: 0,
        mealId: 'meal',
        portion: 1.5,
        meal: { id: 'meal', name: 'Meal', type: 'LUNCH', calories: 400, protein: 20, carbs: 40, fat: 10 },
        side: {
          id: 'side',
          name: 'Side',
          type: 'SALAD',
          calories: 100,
          protein: 5,
          carbs: 10,
          fat: 2,
          ingredients: [],
          spices: [],
          instructions: [],
        },
      },
    ]),
  ).toEqual({ calories: 700, protein: 35, carbs: 70, fat: 17 });
});
