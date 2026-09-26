'use client';

import { ArrowUpRight, MoveRight } from 'lucide-react';
import { HANDBOOK_CHAPTERS, HANDBOOK_PAGES } from '@/features/learn/data/handbook';
import { METHOD_STAGES } from '@/features/learn/data/method';
import { getHandbookProgress } from '@/features/learn/lib/handbook';
import styles from './learn.module.css';

type Props = {
  pageIndex: number;
  onOpen: (pageId?: string) => void;
};

export function MethodLanding({ pageIndex, onOpen }: Props) {
  const progress = getHandbookProgress(pageIndex);
  const currentPage = HANDBOOK_PAGES[pageIndex];
  const hasProgress = pageIndex > 0;

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-7 pt-5">
      <section aria-labelledby="method-title">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-accent)]">Method · Volume 01</p>
        <h1 id="method-title" className="mt-3 max-w-[12ch] text-[2.35rem] font-semibold leading-[0.92] tracking-[-0.065em] text-[var(--color-text)]">
          The Primal Handbook
        </h1>
        <p className="mt-4 max-w-[31rem] text-sm leading-6 text-[var(--color-text-muted)]">
          Training, nutrition, recovery, and the decisions that connect them.
        </p>

        <button
          type="button"
          onClick={() => onOpen()}
          className={`${styles.bookStage} group relative mt-5 block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]`}
          aria-label="Open The Primal Handbook"
        >
          <span className={styles.bookGlow} />
          <span className={`${styles.book} !mx-0 !w-[min(47vw,188px)]`}>
            <span className={`${styles.cover} flex h-full flex-col px-7 pb-6 pt-7`}>
              <span className="relative z-10 text-[8px] font-bold uppercase tracking-[0.32em] text-[var(--color-accent)]">Primal Power</span>
              <span className={`${styles.emboss} relative z-10 mt-auto block font-serif text-[1.75rem] font-bold leading-[0.84] tracking-[-0.055em]`}>THE<br />PRIMAL<br />HANDBOOK</span>
              <span className="relative z-10 mt-4 h-px w-9 bg-[var(--color-accent)]" />
              <span className={`${styles.emboss} relative z-10 mt-4 text-[7px] font-bold uppercase tracking-[0.22em]`}>Train · Fuel · Recover</span>
              <span className="relative z-10 mt-3 text-[8px] font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">Vol. 01</span>
            </span>
          </span>
          <span className="absolute bottom-3 right-0 inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-text)] transition-transform group-hover:translate-x-1">
            {hasProgress ? 'Continue reading' : 'Open handbook'} <ArrowUpRight size={16} className="text-[var(--color-accent)]" />
          </span>
        </button>

        {hasProgress ? (
          <button type="button" onClick={() => onOpen()} className="mt-5 flex w-full items-center justify-between border-y border-[var(--color-border)] py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]">
            <span><span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">Continue reading</span><span className="mt-1 block text-sm font-medium text-[var(--color-text)]">Chapter {currentPage?.chapterNumber ?? '—'} · {currentPage?.chapterLabel}</span></span>
            <span className="text-xs tabular-nums text-[var(--color-text-muted)]">{progress}%</span>
          </button>
        ) : null}
      </section>

      <section className="mt-10" aria-labelledby="system-title">
        <div className="flex items-baseline justify-between gap-4"><h2 id="system-title" className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-accent)]">The system</h2><span className="text-xs text-[var(--color-text-muted)]">Six connected practices</span></div>
        <div className="mt-3 border-y border-[var(--color-border)]">
          {METHOD_STAGES.map(stage => {
            const chapter = HANDBOOK_CHAPTERS.find(item => item.id === stage.id)!;
            return (
              <button key={stage.id} type="button" onClick={() => onOpen(chapter.firstPageId)} className="group flex min-h-[68px] w-full items-center gap-3 border-b border-[var(--color-border)] text-left last:border-b-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]">
                <span className="w-6 font-mono text-[10px] font-bold text-[var(--color-accent)]">{stage.number}</span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]">{stage.label}</span><span className="mt-0.5 block truncate text-xs text-[var(--color-text-muted)]">{stage.statement}</span></span>
                <MoveRight size={17} className="shrink-0 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-accent)]" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
