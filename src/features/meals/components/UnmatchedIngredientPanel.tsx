'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFoods } from '@/features/foods/hooks/useFoods';
import type { FoodMacroUpdatePayload, FoodRecord } from '@/features/foods/types/food.types';
import type { UnmatchedIngredientInput } from '@/types/meal';

type UnmatchedIngredientPanelProps = {
  items: UnmatchedIngredientInput[];
  busy?: boolean;
  onAddIngredientAction: (item: UnmatchedIngredientInput) => void;
  onUseMatchAction: (input: { item: UnmatchedIngredientInput; targetFood: FoodRecord }) => void | Promise<void>;
  onCreateAliasAction: (input: {
    item: UnmatchedIngredientInput;
    targetFood: FoodRecord;
    alias: string;
    updateMacros?: FoodMacroUpdatePayload;
  }) => void | Promise<void>;
};

function buildItemKey(item: UnmatchedIngredientInput): string {
  return `${item.name}::${item.grams}`;
}

export default function UnmatchedIngredientPanel({
  items,
  busy = false,
  onAddIngredientAction,
  onUseMatchAction,
  onCreateAliasAction,
}: UnmatchedIngredientPanelProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const activeItem = useMemo(() => items.find(item => buildItemKey(item) === activeKey) ?? null, [items, activeKey]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [aliasDraft, setAliasDraft] = useState('');
  const [updateMacros, setUpdateMacros] = useState(false);
  const [macroDraft, setMacroDraft] = useState({
    caloriesKcal: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
    fiberG: '',
  });

  useEffect(() => {
    if (!activeItem) return;
    setSearchQuery(activeItem.name);
    setAliasDraft(activeItem.name);
    setSelectedFoodId(null);
    setUpdateMacros(false);
    setMacroDraft({
      caloriesKcal: '',
      proteinG: '',
      carbsG: '',
      fatG: '',
      fiberG: '',
    });
  }, [activeItem]);

  useEffect(() => {
    if (activeKey && !items.some(item => buildItemKey(item) === activeKey)) {
      setActiveKey(null);
    }
  }, [activeKey, items]);

  const searchParams = useMemo(
    () => ({
      q: searchQuery.trim(),
      isActive: true,
      limit: 8,
    }),
    [searchQuery],
  );

  const { items: foodMatches, isLoading } = useFoods(searchParams);
  const selectedFood = useMemo(
    () => foodMatches.find(food => food.id === selectedFoodId) ?? null,
    [foodMatches, selectedFoodId],
  );
  const hasValidMacroDraft = useMemo(() => {
    if (!updateMacros) return true;

    const calories = Number(macroDraft.caloriesKcal);
    const protein = Number(macroDraft.proteinG);
    const carbs = Number(macroDraft.carbsG);
    const fat = Number(macroDraft.fatG);
    const fiber = macroDraft.fiberG.trim() ? Number(macroDraft.fiberG) : null;

    if (![calories, protein, carbs, fat].every(Number.isFinite)) {
      return false;
    }

    if (fiber != null && !Number.isFinite(fiber)) {
      return false;
    }

    return true;
  }, [macroDraft, updateMacros]);

  useEffect(() => {
    if (!selectedFood) return;
    setMacroDraft({
      caloriesKcal: `${selectedFood.caloriesKcal}`,
      proteinG: `${selectedFood.proteinG}`,
      carbsG: `${selectedFood.carbsG}`,
      fatG: `${selectedFood.fatG}`,
      fiberG: selectedFood.fiberG == null ? '' : `${selectedFood.fiberG}`,
    });
  }, [selectedFood]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-amber-100">Unmatched AI Ingredients</h3>
        <p className="mt-1 text-sm text-amber-200/80">
          Add the missing ingredient to the database or map the AI term to an existing ingredient alias.
        </p>
      </div>

      <div className="space-y-3">
        {items.map(item => {
          const itemKey = buildItemKey(item);
          const isActive = itemKey === activeKey;

          return (
            <div key={itemKey} className="rounded-2xl border border-amber-500/20 bg-black/10 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-50">{item.name}</p>
                  <p className="text-xs text-amber-100/70">Suggested amount: {Math.round(item.grams)}g</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onAddIngredientAction(item)}
                    className="rounded-xl border border-amber-400/30 bg-amber-300/10 px-3 py-2 text-xs font-medium text-amber-50 transition-colors hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add Ingredient
                  </button>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setActiveKey(prev => (prev === itemKey ? null : itemKey))}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-alt)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isActive ? 'Hide Alias Search' : 'Create Alias'}
                  </button>
                </div>
              </div>

              {isActive && activeItem ? (
                <div className="mt-3 space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">
                      Find target ingredient
                    </label>
                    <input
                      value={searchQuery}
                      onChange={event => setSearchQuery(event.target.value)}
                      className="input-base w-full"
                      placeholder="Search existing ingredient"
                    />
                  </div>

                  {isLoading ? (
                    <p className="text-xs text-[var(--color-text-muted)]">Searching ingredients...</p>
                  ) : foodMatches.length > 0 ? (
                    <div className="space-y-2">
                      {foodMatches.map(food => (
                        <div
                          key={food.id}
                          className={`rounded-xl border px-3 py-3 ${
                            selectedFoodId === food.id
                              ? 'border-[var(--color-accent)] bg-[var(--color-surface)]'
                              : 'border-[var(--color-border)] bg-[var(--color-bg-alt)]'
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-[var(--color-text)]">{food.name}</p>
                              <p className="text-xs text-[var(--color-text-muted)]">
                                {food.category} • {food.state}
                              </p>
                              {food.aliases && food.aliases.length > 0 ? (
                                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                                  Aliases: {food.aliases.slice(0, 3).join(', ')}
                                </p>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => onUseMatchAction({ item: activeItem, targetFood: food })}
                                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg-alt)] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Match Now
                              </button>

                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setSelectedFoodId(food.id)}
                                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-bg-alt)] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {selectedFoodId === food.id ? 'Editing This Match' : 'Edit Match'}
                              </button>
                            </div>
                          </div>

                          {selectedFoodId === food.id ? (
                            <div className="space-y-3 border-t border-[var(--color-border)] pt-3">
                              <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-3 py-2 text-xs text-[var(--color-text)]">
                                You are editing this found match before saving the alias. You can change the alias text
                                and optionally update the ingredient macros.
                              </div>

                              <div>
                                <label className="mb-2 block text-xs font-medium text-[var(--color-text)]">
                                  Alias text
                                </label>
                                <input
                                  value={aliasDraft}
                                  onChange={event => setAliasDraft(event.target.value)}
                                  className="input-base w-full"
                                  placeholder="Edit alias text"
                                />
                              </div>

                              <label className="inline-flex items-center gap-2 text-xs text-[var(--color-text)]">
                                <input
                                  type="checkbox"
                                  checked={updateMacros}
                                  onChange={event => setUpdateMacros(event.target.checked)}
                                />
                                Update ingredient macros globally
                              </label>

                              {updateMacros ? (
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                  <input
                                    value={macroDraft.caloriesKcal}
                                    onChange={event =>
                                      setMacroDraft(prev => ({
                                        ...prev,
                                        caloriesKcal: event.target.value,
                                      }))
                                    }
                                    className="input-base w-full"
                                    placeholder="kcal"
                                  />
                                  <input
                                    value={macroDraft.proteinG}
                                    onChange={event =>
                                      setMacroDraft(prev => ({
                                        ...prev,
                                        proteinG: event.target.value,
                                      }))
                                    }
                                    className="input-base w-full"
                                    placeholder="protein"
                                  />
                                  <input
                                    value={macroDraft.carbsG}
                                    onChange={event =>
                                      setMacroDraft(prev => ({
                                        ...prev,
                                        carbsG: event.target.value,
                                      }))
                                    }
                                    className="input-base w-full"
                                    placeholder="carbs"
                                  />
                                  <input
                                    value={macroDraft.fatG}
                                    onChange={event =>
                                      setMacroDraft(prev => ({
                                        ...prev,
                                        fatG: event.target.value,
                                      }))
                                    }
                                    className="input-base w-full"
                                    placeholder="fat"
                                  />
                                  <input
                                    value={macroDraft.fiberG}
                                    onChange={event =>
                                      setMacroDraft(prev => ({
                                        ...prev,
                                        fiberG: event.target.value,
                                      }))
                                    }
                                    className="input-base w-full"
                                    placeholder="fiber"
                                  />
                                </div>
                              ) : null}

                              <button
                                type="button"
                                disabled={
                                  busy ||
                                  !aliasDraft.trim() ||
                                  (updateMacros &&
                                    (!macroDraft.caloriesKcal ||
                                      !macroDraft.proteinG ||
                                      !macroDraft.carbsG ||
                                      !macroDraft.fatG ||
                                      !hasValidMacroDraft))
                                }
                                onClick={() => {
                                  const macroPayload = updateMacros
                                    ? {
                                        caloriesKcal: Number(macroDraft.caloriesKcal),
                                        proteinG: Number(macroDraft.proteinG),
                                        carbsG: Number(macroDraft.carbsG),
                                        fatG: Number(macroDraft.fatG),
                                        fiberG: macroDraft.fiberG.trim() ? Number(macroDraft.fiberG) : null,
                                      }
                                    : undefined;

                                  onCreateAliasAction({
                                    item: activeItem,
                                    targetFood: food,
                                    alias: aliasDraft.trim(),
                                    updateMacros: macroPayload,
                                  });
                                }}
                                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-bg-alt)] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Save Alias
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      No existing ingredient matches found for this alias search.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
