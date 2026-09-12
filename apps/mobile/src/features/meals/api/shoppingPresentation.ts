import type { ShoppingListSection } from '@primal/contracts/meals/types/shoppingList.types';

export function shoppingListText(sections: ShoppingListSection[]) {
  return sections
    .map(
      section =>
        `${section.title.toUpperCase()}\n${section.items.map(item => `- ${[item.quantity, item.label].filter(Boolean).join(' ')}`).join('\n')}`,
    )
    .join('\n\n');
}

export function checkShoppingItems(current: string[], ids: string[], checked: boolean) {
  const next = new Set(current);
  for (const id of ids) {
    if (checked) next.add(id);
    else next.delete(id);
  }
  return [...next];
}
