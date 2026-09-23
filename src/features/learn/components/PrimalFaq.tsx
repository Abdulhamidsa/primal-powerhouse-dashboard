'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ChevronDown, Search, X } from 'lucide-react';
import { FAQ_ENTRIES } from '@/features/learn/data/faq';
import { filterFaqEntries } from '@/features/learn/lib/handbook';
import { cn } from '@/lib/utils';

export function PrimalFaq({ onOpenHandbook }: { onOpenHandbook: (pageId: string) => void }) {
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const reduceMotion = useReducedMotion();
  const results = useMemo(() => filterFaqEntries(FAQ_ENTRIES, query), [query]);

  const toggle = (id: string) => setOpenIds(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <section className="px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">Ask Primal</p>
        <h2 className="mt-4 max-w-[12ch] text-4xl font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--color-text)] sm:text-6xl">Questions you’re probably thinking.</h2>
        <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--color-text-muted)]">Clear answers for the moments when the plan meets real life.</p>

        <label className="mt-9 flex min-h-14 items-center gap-3 border-y border-[var(--color-border)] px-1 focus-within:border-[var(--color-accent)]">
          <Search size={18} className="shrink-0 text-[var(--color-accent)]" />
          <span className="sr-only">Search Primal questions</span>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search Primal…" className="min-w-0 flex-1 bg-transparent py-4 text-base text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]" />
          {query ? <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="grid h-11 w-11 place-items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]"><X size={17} /></button> : null}
        </label>

        <div className="mt-6 border-t border-[var(--color-border)]">
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
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div id={answerId} initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }} transition={{ duration: reduceMotion ? 0.08 : 0.25 }} className="overflow-hidden">
                      <div className="pb-6 pl-8 pr-3 sm:pl-10">
                        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-muted)]">{entry.answer}</p>
                        {entry.handbookPageId ? (
                          <button type="button" onClick={() => onOpenHandbook(entry.handbookPageId!)} className="group mt-5 inline-flex min-h-11 items-center gap-2 border-b border-[var(--color-accent)] text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]">
                            Read more <span className="text-[var(--color-text-muted)]">{entry.handbookLabel}</span><ArrowUpRight size={14} className="text-[var(--color-accent)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          </button>
                        ) : null}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {!results.length ? <div className="border-b border-[var(--color-border)] py-12 text-center"><p className="text-sm font-semibold text-[var(--color-text)]">No answer found yet.</p><p className="mt-2 text-sm text-[var(--color-text-muted)]">Try a broader word or clear the search.</p><button type="button" onClick={() => setQuery('')} className="mt-5 min-h-11 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">Clear search</button></div> : null}
      </div>
    </section>
  );
}
