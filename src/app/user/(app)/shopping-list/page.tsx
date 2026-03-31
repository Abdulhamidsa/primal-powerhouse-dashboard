'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck, Clipboard, RefreshCcw, ShoppingBasket } from 'lucide-react';
import { useGenerateShoppingList } from '@/features/meals/hooks/useGenerateShoppingList';
import { loadShoppingListDraft } from '@/features/meals/utils/shoppingListStorage';
import type { ShoppingListEntry } from '@/features/meals/types/shoppingList.types';

export default function ShoppingListPage() {
  const router = useRouter();
  const { run, isLoading, error, data } = useGenerateShoppingList();
  const [checkedById, setCheckedById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const draft = loadShoppingListDraft();
    if (!draft.length) return;

    void run({ items: draft });
  }, [run]);

  useEffect(() => {
    if (!data?.selectionFingerprint) return;

    const key = getChecklistStorageKey(data.selectionFingerprint);
    const saved = window.localStorage.getItem(key);
    if (!saved) {
      setCheckedById({});
      return;
    }

    try {
      const parsed = JSON.parse(saved) as Record<string, boolean>;
      setCheckedById(parsed ?? {});
    } catch {
      setCheckedById({});
    }
  }, [data?.selectionFingerprint]);

  useEffect(() => {
    if (!data?.selectionFingerprint) return;
    const key = getChecklistStorageKey(data.selectionFingerprint);
    window.localStorage.setItem(key, JSON.stringify(checkedById));
  }, [checkedById, data?.selectionFingerprint]);

  const totalCount = useMemo(() => {
    return (data?.sections ?? []).reduce((sum, section) => sum + section.items.length, 0);
  }, [data?.sections]);

  const checkedCount = useMemo(() => {
    return Object.values(checkedById).filter(Boolean).length;
  }, [checkedById]);

  const copyAsText = async () => {
    if (!data?.sections.length) return;

    const lines: string[] = [];
    data.sections.forEach(section => {
      lines.push(section.title);
      section.items.forEach(item => {
        lines.push(`- ${item.label}`);
      });
      lines.push('');
    });

    await navigator.clipboard.writeText(lines.join('\n').trim());
  };

  const markAllInSection = (items: ShoppingListEntry[], checked: boolean) => {
    setCheckedById(current => {
      const next = { ...current };
      items.forEach(item => {
        next[item.id] = checked;
      });
      return next;
    });
  };

  return (
    <div className="min-h-screen px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
              <ShoppingBasket size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)] sm:text-2xl">
                Shopping List
              </h1>
              <p className="mt-1 text-sm leading-5 text-[var(--color-text-muted)] sm:text-[15px]">
                Check off what you already have. This list is generated from your selected meals and spices.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--color-bg-alt)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)]">
                  {checkedCount}/{totalCount} checked
                </span>

                <button
                  type="button"
                  onClick={copyAsText}
                  disabled={!data?.sections.length}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-1 text-xs font-semibold text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Clipboard size={12} />
                  Copy Text
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const draft = loadShoppingListDraft();
                    if (!draft.length) return;
                    void run({ items: draft });
                  }}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-1 text-xs font-semibold text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCcw size={12} />
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-muted)]">
            Generating shopping list...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error.message}
          </div>
        ) : null}

        {!isLoading && !error && (!data || data.sections.every(section => section.items.length === 0)) ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-muted)]">
            No shopping items found. Go back to your plan and select meals first.
            <div className="mt-3">
              <button
                type="button"
                onClick={() => router.push('/user/my-plan')}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2 text-xs font-semibold text-[var(--color-text)]"
              >
                Back to Plan
              </button>
            </div>
          </div>
        ) : null}

        {data?.sections.map(section => (
          <section
            key={section.key}
            className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[var(--color-text)]">{section.title}</h2>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[var(--color-bg-alt)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)]">
                  {section.items.filter(item => checkedById[item.id]).length}/{section.items.length}
                </span>
                <button
                  type="button"
                  onClick={() => markAllInSection(section.items, true)}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[11px] text-[var(--color-text-muted)]"
                >
                  <CheckCheck size={11} />
                  Mark all
                </button>
              </div>
            </div>

            {section.items.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">No items in this section.</p>
            ) : (
              <ul className="space-y-2">
                {section.items.map(item => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-alt)] px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(checkedById[item.id])}
                      onChange={event => {
                        const checked = event.target.checked;
                        setCheckedById(current => ({ ...current, [item.id]: checked }));
                      }}
                      className="h-4 w-4 accent-[var(--color-accent)]"
                    />
                    <span
                      className={`text-sm ${checkedById[item.id] ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function getChecklistStorageKey(fingerprint: string): string {
  const dateKey = new Date().toISOString().slice(0, 10);
  return `shopping-list-checks:${dateKey}:${fingerprint}`;
}
