import { useState } from 'react';
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useResource, useDraft } from '@/features/resources/hooks/useResource';
import { useConnection } from '@/features/resources/hooks/useConnection';
import { useToday } from '@/features/today/hooks/useToday';
import { generateShoppingListSchema } from '@primal/contracts/meals/schemas/shoppingList.schema';
import * as api from '../api/meals.api';
import { checkShoppingItems, shoppingListText } from '../api/shoppingPresentation';

export function useShopping() {
  const { offline } = useConnection();
  const today = useToday();
  const selection = useResource('/api/user/meals/selection', api.getMealSelection);
  const selected = selection.data?.selection.items ?? [];
  const source = selected.map(({ mealType, slotIndex, mealId, sourceAssignmentId }) => ({
    mealType,
    slotIndex,
    mealId,
    sourceAssignmentId,
  }));
  const key = selected.length
    ? `/api/user/meals/shopping-list?selection=${encodeURIComponent(JSON.stringify(selected))}`
    : null;
  const list = useResource(key, () => api.getShoppingList(generateShoppingListSchema.parse({ items: source })));
  const checks = useDraft<string[]>(
    `shopping-checks:${today.data?.dailyCheckIn.dayDate ?? 'loading'}:${list.data?.selectionFingerprint ?? 'loading'}`,
    [],
  );
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const sections = (list.data?.sections ?? []).map(section => ({
    ...section,
    allChecked: section.items.length > 0 && section.items.every(item => checks.value.includes(item.id)),
  }));
  const items = sections.flatMap(section => section.items);
  const checkedCount = items.filter(item => checks.value.includes(item.id)).length;
  const text = shoppingListText(sections);
  async function copy() {
    setError('');
    setNotice('');
    try {
      await Clipboard.setStringAsync(text);
      setNotice('Copied to clipboard');
    } catch {
      setError('Unable to copy the list. Please try sharing it.');
    }
  }
  async function share() {
    setError('');
    setNotice('');
    try {
      await Share.share({ title: 'My Primal Power shopping list', message: text });
    } catch {
      setError('Unable to share the list. Please try copying it.');
    }
  }
  return {
    selection,
    list,
    sections,
    checked: checks.value,
    checkedCount,
    totalCount: items.length,
    ready: checks.ready && !!today.data?.dailyCheckIn.dayDate,
    offline,
    error,
    notice,
    copy,
    share,
    refresh: () => {
      void selection
        .refresh()
        .then(() => list.refresh())
        .catch(() => {});
    },
    toggle: (id: string) => checks.setValue(old => checkShoppingItems(old, [id], !old.includes(id))),
    markSection: (key: string, checked: boolean) =>
      checks.setValue(old =>
        checkShoppingItems(
          old,
          sections.find(section => section.key === key)?.items.map(item => item.id) ?? [],
          checked,
        ),
      ),
    reset: () => checks.setValue([]),
  };
}
