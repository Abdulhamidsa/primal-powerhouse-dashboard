'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Check, RefreshCcw, Share2, ShoppingBag } from 'lucide-react';
import { PullToRefresh } from '@/components/PullToRefresh';
import { UserPageHero } from '@/components/UserPageHero';
import { Button } from '@/components/ui/button';
import { getUserMealSelection, USER_MEAL_SELECTION_URL } from '@/features/meals/api/mealSelection.api';
import { getSavedShoppingList, USER_SHOPPING_LIST_URL } from '@/features/meals/api/shoppingList.api';
import { useGenerateShoppingList } from '@/features/meals/hooks/useGenerateShoppingList';
import { useOfflineStatus } from '@/features/offline/components/OfflineProvider';
import { loadShoppingListDraft } from '@/features/meals/utils/shoppingListStorage';
import type { ShoppingListEntry } from '@/features/meals/types/shoppingList.types';

function getChecklistStorageKey(fingerprint: string): string {
  const dateKey = new Date().toISOString().slice(0, 10);
  return `shopping-list-checks:${dateKey}:${fingerprint}`;
}

function buildCopyText(sections: NonNullable<ReturnType<typeof useGenerateShoppingList>['data']>['sections']) {
  const lines: string[] = [];

  sections.forEach(section => {
    lines.push(section.title.toUpperCase());
    section.items.forEach(item => {
      lines.push(`- ${item.label}`);
    });
    lines.push('');
  });

  return lines.join('\n').trim();
}

function ShoppingListSkeleton() {
  return (
    <div className="space-y-4">
      {[6, 5, 7].map((lines, i) => (
        <div key={i} className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <div className="h-3 w-20 animate-pulse rounded-full bg-muted/40" />
          </div>
          <div className="space-y-0">
            {Array.from({ length: lines }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <div className="h-5 w-5 animate-pulse rounded-full bg-muted/40" />
                <div className="h-3 w-[72%] animate-pulse rounded-full bg-muted/40" />
                <div className="ml-auto h-3 w-12 animate-pulse rounded-full bg-muted/40" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ShoppingListPage() {
  const router = useRouter();
  const { isOffline } = useOfflineStatus();
  const { run, isLoading, error, data } = useGenerateShoppingList();
  const [checkedById, setCheckedById] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const selectionSWR = useSWR(USER_MEAL_SELECTION_URL, getUserMealSelection);
  const savedShoppingListSWR = useSWR(USER_SHOPPING_LIST_URL, getSavedShoppingList, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  const displayedData = isOffline ? savedShoppingListSWR.data ?? data : data ?? savedShoppingListSWR.data;

  const savedItems = useMemo(() => {
    return (selectionSWR.data?.selection?.items ?? []).map(item => ({
      mealType: item.mealType,
      slotIndex: item.slotIndex,
      mealId: item.mealId,
      sourceAssignmentId: item.sourceAssignmentId ?? null,
    }));
  }, [selectionSWR.data]);

  const runFromItems = (items: typeof savedItems) => {
    if (isOffline) return;
    if (items.length) {
      void run({ items });
      return;
    }

    const draft = loadShoppingListDraft();
    if (draft.length) {
      void run({ items: draft });
    }
  };

  const handleGenerate = () => {
    runFromItems(savedItems);
  };

  const refreshShoppingList = async () => {
    const nextSelection = await selectionSWR.mutate();
    const nextItems = (nextSelection?.selection?.items ?? []).map(item => ({
      mealType: item.mealType,
      slotIndex: item.slotIndex,
      mealId: item.mealId,
      sourceAssignmentId: item.sourceAssignmentId ?? null,
    }));
    runFromItems(nextItems);
  };

  useEffect(() => {
    if (isOffline) return;
    if (!selectionSWR.data) return;
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline, selectionSWR.data]);

  useEffect(() => {
    if (!displayedData?.selectionFingerprint) return;
    const key = getChecklistStorageKey(displayedData.selectionFingerprint);
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
  }, [displayedData?.selectionFingerprint]);

  useEffect(() => {
    if (!displayedData?.selectionFingerprint) return;
    const key = getChecklistStorageKey(displayedData.selectionFingerprint);
    window.localStorage.setItem(key, JSON.stringify(checkedById));
  }, [checkedById, displayedData?.selectionFingerprint]);

  useEffect(() => {
    if (!copied) return;
    const timeoutId = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  useEffect(() => {
    if (!shared) return;
    const timeoutId = window.setTimeout(() => setShared(false), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [shared]);

  const allItems = useMemo(() => (displayedData?.sections ?? []).flatMap(s => s.items), [displayedData]);
  const totalCount = allItems.length;
  const checkedCount = useMemo(() => Object.values(checkedById).filter(Boolean).length, [checkedById]);
  // const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const hasItems = !!displayedData && displayedData.sections.some(s => s.items.length > 0);
  const isPageLoading = isOffline ? !displayedData && savedShoppingListSWR.isLoading : isLoading || selectionSWR.isLoading;
  const completionPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

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
    if (!displayedData?.sections.length) return;

    try {
      const text = buildCopyText(displayedData.sections);
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {}
  };

  const shareList = async () => {
    if (!displayedData?.sections.length) return;

    const text = buildCopyText(displayedData.sections);
    const title = 'My Primal Power shopping list';

    try {
      if (navigator.share) {
        await navigator.share({ title, text });
        setShared(true);
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {}
  };

  const copiedLabel = copied ? 'Copied to clipboard' : 'Copy list';

  return (
    <PullToRefresh onRefreshAction={refreshShoppingList}>
      <div className="min-h-screen bg-background pb-20">
        <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-4">
        <UserPageHero
          eyebrow="Shopping List"
          title="Everything in one place"
          description="Ingredients, spices, and meal notes pulled from your selected plan."
          icon={<ShoppingBag size={17} />}
          statusItems={[
            { label: 'Checked', value: `${checkedCount}/${totalCount || 0}`, tone: checkedCount ? 'good' : 'neutral' },
            { label: 'Complete', value: `${completionPct}%`, tone: completionPct === 100 ? 'good' : 'neutral' },
          ]}
        >
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isPageLoading}
              className="h-8 rounded-full flex gap-2 border-border bg-background px-3 text-xs text-foreground"
            >
              <RefreshCcw size={12} className={isPageLoading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <button
              type="button"
              onClick={() => void shareList()}
              disabled={!hasItems}
              className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Share shopping list"
              title="Share list"
            >
              <Share2 size={13} />
              Share
            </button>
            <button
              type="button"
              onClick={() => void copyAsText()}
              disabled={!hasItems}
              className="inline-flex min-h-8 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-40"
              title={copiedLabel}
            >
              Copy text
            </button>
          </div>

          {copied ? (
            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
              Shopping list copied.
            </div>
          ) : null}

          {shared ? (
            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
              Shopping list shared.
            </div>
          ) : null}
        </UserPageHero>

        {error && !isPageLoading ? (
          <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.message}
          </div>
        ) : null}

        {isPageLoading ? (
          <div className="mt-4">
            <ShoppingListSkeleton />
          </div>
        ) : null}

        {!isPageLoading && !error && !hasItems ? (
          <section className="mt-5 rounded-[30px] border border-border bg-card px-5 py-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
              <ShoppingBag size={26} />
            </div>
            <p className="mt-4 text-sm font-semibold tracking-tight text-foreground">No shopping list yet</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Select meals in My Plan, then come back here to see your list.
            </p>
            <Button type="button" onClick={() => router.push('/user/my-plan')} className="mt-5 h-11 rounded-full px-5">
              Go to My Plan
            </Button>
          </section>
        ) : null}

        {!isPageLoading &&
          displayedData?.sections.map(section => {
            if (section.items.length === 0) return null;
            const sectionChecked = section.items.filter(item => checkedById[item.id]).length;
            const allSectionChecked = sectionChecked === section.items.length;

            return (
              <section key={section.key} className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold tracking-tight text-foreground">{section.title}</h2>
                    <span className="rounded-full bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {section.items.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => markAllInSection(section.items, !allSectionChecked)}
                    className="text-xs font-semibold text-primary transition-opacity active:opacity-60"
                  >
                    {allSectionChecked ? 'Uncheck all' : 'Mark all'}
                  </button>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
                  {section.items.map((item, index) => {
                    const isChecked = Boolean(checkedById[item.id]);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleItem(item.id)}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:opacity-70"
                        style={{
                          borderTop: index === 0 ? 'none' : '1px solid var(--color-border)',
                        }}
                      >
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
              </section>
            );
          })}
        </div>
      </div>
    </PullToRefresh>
  );
}
