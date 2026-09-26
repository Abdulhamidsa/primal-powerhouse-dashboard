'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { FAQ_ENTRIES } from '@/features/learn/data/faq';
import { filterFaqEntries } from '@/features/learn/lib/handbook';
import { cn } from '@/lib/utils';

export function PrimalFaq() {
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const results = useMemo(() => filterFaqEntries(FAQ_ENTRIES, query), [query]);

  const toggle = (id: string) => setOpenIds(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <section className="mx-auto max-w-xl px-4 pb-6 pt-5" aria-labelledby="faq-title">
      <div className="border-t border-[var(--color-border)] pt-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">FAQ</p>
        <h2 id="faq-title" className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--color-text)]">Questions, answered.</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">Quick, practical answers for the moments you need them.</p>

        <label className="mt-5 flex min-h-12 items-center gap-3 border-y border-[var(--color-border)] px-1 focus-within:border-[var(--color-accent)]">
          <Search size={18} className="shrink-0 text-[var(--color-accent)]" />
          <span className="sr-only">Search Primal questions</span>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search Primal…" className="min-w-0 flex-1 bg-transparent py-4 text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]" />
          {query ? <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="grid h-11 w-11 place-items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><X size={17} /></button> : null}
        </label>

        <div className="mt-4 border-t border-[var(--color-border)]">
          {results.map((entry, index) => {
            const open = openIds.has(entry.id);
            const answerId = `faq-answer-${entry.id}`;
            return (
              <div key={entry.id} className="border-b border-[var(--color-border)]">
                <button type="button" aria-expanded={open} aria-controls={answerId} onClick={() => toggle(entry.id)} className="group flex min-h-[72px] w-full items-center gap-4 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]">
                  <span className="font-mono text-[9px] font-bold text-[var(--color-accent)]">{String(index + 1).padStart(2, '0')}</span>
                  <span className="flex-1 text-sm font-semibold leading-6 text-[var(--color-text)] sm:text-base">{entry.question}</span>
                  <ChevronDown size={18} className={cn('shrink-0 text-[var(--color-text-muted)] transition-transform', open && 'rotate-180 text-[var(--color-accent)]')} />
                </button>
                {open ? (
                  <div id={answerId} className="pb-6 pl-8 pr-3 sm:pl-10">
                    <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-muted)]">{entry.answer}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {!results.length ? <div className="border-b border-[var(--color-border)] py-12 text-center"><p className="text-sm font-semibold text-[var(--color-text)]">No answer found yet.</p><p className="mt-2 text-sm text-[var(--color-text-muted)]">Try a broader word or clear the search.</p><button type="button" onClick={() => setQuery('')} className="mt-5 min-h-11 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">Clear search</button></div> : null}
      </div>
    </section>
  );
}
