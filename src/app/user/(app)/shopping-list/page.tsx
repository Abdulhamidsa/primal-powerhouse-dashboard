'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Check, Clipboard, RefreshCcw, ShoppingBag } from 'lucide-react';
import { getUserMealSelection, USER_MEAL_SELECTION_URL } from '@/features/meals/api/mealSelection.api';
import { useGenerateShoppingList } from '@/features/meals/hooks/useGenerateShoppingList';
import { loadShoppingListDraft } from '@/features/meals/utils/shoppingListStorage';
import type { ShoppingListEntry } from '@/features/meals/types/shoppingList.types';

function getChecklistStorageKey(fingerprint: string): string {
  const dateKey = new Date().toISOString().slice(0, 10);
  return `shopping-list-checks:${dateKey}:${fingerprint}`;
}

export default function ShoppingListPage() {
  const router = useRouter();
  const { run, isLoading, error, data } = useGenerateShoppingList();
  const [checkedById, setCheckedById] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const selectionSWR = useSWR(USER_MEAL_SELECTION_URL, getUserMealSelection);

  const savedItems = useMemo(() => {
    return (selectionSWR.data?.selection?.items ?? []).map(item => ({
      mealType: item.mealType,
      slotIndex: item.slotIndex,
      mealId: item.mealId,
      sourceAssignmentId: item.sourceAssignmentId ?? null,
    }));
  }, [selectionSWR.data]);

  const handleGenerate = () => {
    if (savedItems.length) {
      void run({ items: savedItems });
      return;
    }
    const draft = loadShoppingListDraft();
    if (draft.length) {
      void run({ items: draft });
    }
  };

  useEffect(() => {
    if (!selectionSWR.data) return;
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionSWR.data]);

  useEffect(() => {
    if (!data?.selectionFingerprint) return;
    const key = getChecklistStorageKey(data.selectionFingerprint);
    const saved = window.localStorage.getItem(key);
    if (!saved) {
      setCheckedById({});
      return;
    }
    try {
      setCheckedById((JSON.parse(saved) as Record<string, boolean>) ?? {});
    } catch {
      setCheckedById({});
    }
  }, [data?.selectionFingerprint]);

  useEffect(() => {
    if (!data?.selectionFingerprint) return;
    const key = getChecklistStorageKey(data.selectionFingerprint);
    window.localStorage.setItem(key, JSON.stringify(checkedById));
  }, [checkedById, data?.selectionFingerprint]);

  const allItems = useMemo(() => (data?.sections ?? []).flatMap(s => s.items), [data]);
  const totalCount = allItems.length;
  const checkedCount = useMemo(() => Object.values(checkedById).filter(Boolean).length, [checkedById]);
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const hasItems = !!data && data.sections.some(s => s.items.length > 0);
  const isPageLoading = isLoading || selectionSWR.isLoading;

  const toggleItem = (id: string) => setCheckedById(prev => ({ ...prev, [id]: !prev[id] }));

  const markAllInSection = (items: ShoppingListEntry[], checked: boolean) =>
    setCheckedById(prev => {
      const next = { ...prev };
      items.forEach(item => {
        next[item.id] = checked;
      });
      return next;
    });

  const copyAsText = async () => {
    if (!data?.sections.length) return;
    const lines: string[] = [];
    data.sections.forEach(section => {
      lines.push(section.title.toUpperCase());
      section.items.forEach(item => {
        lines.push(`• ${item.label}`);
      });
      lines.push('');
    });
    try {
      await navigator.clipboard.writeText(lines.join('\n').trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: 'var(--color-bg)' }}>
      <div className="mx-auto max-w-lg px-4">
        {/* Page header — title + description only */}
        <div className="pb-1 pt-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: 'var(--color-accent-muted)' }}
            >
              <ShoppingBag size={17} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight" style={{ color: 'var(--color-text)' }}>
                Shopping List
              </h1>
              <p className="text-xs leading-tight" style={{ color: 'var(--color-text-muted)' }}>
                All ingredients and spices from your selected meals
              </p>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div
          className="mt-4 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <div className="min-w-0">
            {hasItems ? (
              <>
                <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                  {checkedCount === totalCount && totalCount > 0
                    ? 'All done!'
                    : `${checkedCount} of ${totalCount} checked`}
                </p>
                <div
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                  style={{ background: 'var(--color-bg-alt)', width: '140px' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: 'var(--color-accent)' }}
                  />
                </div>
              </>
            ) : (
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Select meals in your plan to generate a list
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void copyAsText()}
              disabled={!hasItems}
              title={copied ? 'Copied!' : 'Copy list'}
              className="flex h-8 w-8 items-center justify-center rounded-xl border transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-bg-alt)',
                color: copied ? 'var(--color-accent)' : 'var(--color-text-muted)',
                opacity: !hasItems ? 0.4 : 1,
              }}
            >
              <Clipboard size={14} />
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isPageLoading}
              title="Refresh list"
              className="flex h-8 w-8 items-center justify-center rounded-xl border transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text-muted)',
                opacity: isPageLoading ? 0.4 : 1,
              }}
            >
              <RefreshCcw size={14} className={isPageLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && !isPageLoading ? (
          <div
            className="mt-4 rounded-2xl border px-4 py-3 text-sm"
            style={{
              borderColor: 'var(--color-danger, #ef4444)',
              color: 'var(--color-danger, #ef4444)',
              background: 'color-mix(in srgb, var(--color-danger, #ef4444) 8%, transparent)',
            }}
          >
            {error.message}
          </div>
        ) : null}

        {/* Skeleton loading */}
        {isPageLoading ? (
          <div className="mt-4 space-y-3">
            {[6, 5, 7, 4, 6].map((lines, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div className="px-4 py-2.5">
                  <div
                    className="mb-2 h-3 w-20 animate-pulse rounded-full"
                    style={{ background: 'var(--color-bg-alt)' }}
                  />
                </div>
                {Array.from({ length: lines }).map((_, j) => (
                  <div
                    key={j}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderTop: '1px solid var(--color-border)' }}
                  >
                    <div
                      className="h-6 w-6 shrink-0 animate-pulse rounded-full"
                      style={{ background: 'var(--color-bg-alt)' }}
                    />
                    <div
                      className="h-3 animate-pulse rounded-full"
                      style={{ background: 'var(--color-bg-alt)', width: `${50 + Math.random() * 30}%` }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : null}

        {/* Empty state */}
        {!isPageLoading && !error && !hasItems ? (
          <div className="mt-8 flex flex-col items-center gap-4 py-10 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-3xl"
              style={{ background: 'var(--color-bg-alt)' }}
            >
              <ShoppingBag size={28} style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                No items yet
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Go to your plan, select your meals,
                <br />
                then come back here.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/user/my-plan')}
              className="rounded-2xl px-5 py-2.5 text-sm font-semibold transition-opacity active:opacity-70"
              style={{ background: 'var(--color-accent)', color: 'var(--color-text-on-accent)' }}
            >
              Go to My Plan
            </button>
          </div>
        ) : null}

        {/* Sections */}
        {!isPageLoading &&
          data?.sections.map(section => {
            if (section.items.length === 0) return null;
            const sectionChecked = section.items.filter(item => checkedById[item.id]).length;
            const allSectionChecked = sectionChecked === section.items.length;

            return (
              <div key={section.key} className="mt-5">
                {/* Section header */}
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {section.title}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text-muted)' }}
                    >
                      {section.items.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => markAllInSection(section.items, !allSectionChecked)}
                    className="text-[12px] font-semibold transition-opacity active:opacity-60"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {allSectionChecked ? 'Uncheck all' : 'Mark all'}
                  </button>
                </div>

                {/* iOS-style list card */}
                <div
                  className="overflow-hidden rounded-2xl"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  {section.items.map((item, index) => {
                    const isChecked = Boolean(checkedById[item.id]);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition-colors active:opacity-70"
                        style={{
                          borderTop: index === 0 ? 'none' : '1px solid var(--color-border)',
                          borderBottom: 'none',
                          background: 'transparent',
                        }}
                      >
                        {/* Circle checkbox */}
                        <span
                          className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full transition-all duration-150"
                          style={
                            isChecked
                              ? { background: 'var(--color-accent)', border: 'none' }
                              : { background: 'transparent', border: '2px solid var(--color-border)' }
                          }
                        >
                          {isChecked && <Check size={12} color="white" strokeWidth={3.5} />}
                        </span>

                        {/* Name */}
                        <span
                          className="flex-1 text-[15px] leading-snug transition-all duration-150"
                          style={{
                            color: isChecked ? 'var(--color-text-muted)' : 'var(--color-text)',
                            textDecoration: isChecked ? 'line-through' : 'none',
                            opacity: isChecked ? 0.55 : 1,
                          }}
                        >
                          {item.label}
                        </span>

                        {/* Quantity — right side */}
                        {item.quantity ? (
                          <span
                            className="ml-3 shrink-0 rounded-lg px-2 py-0.5 text-[12px] font-semibold tabular-nums transition-opacity"
                            style={{
                              background: isChecked ? 'var(--color-bg)' : 'var(--color-bg-alt)',
                              color: isChecked ? 'var(--color-text-muted)' : 'var(--color-accent)',
                              opacity: isChecked ? 0.4 : 1,
                            }}
                          >
                            {item.quantity}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
