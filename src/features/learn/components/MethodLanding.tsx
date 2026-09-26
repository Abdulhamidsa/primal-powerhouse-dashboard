'use client';

import { ArrowUpRightIcon as ArrowUpRight, BookOpenTextIcon as BookOpenText } from '@phosphor-icons/react';
import { HANDBOOK_PAGES } from '@/features/learn/data/handbook';
import { UserPageHero } from '@/components/UserPageHero';
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
    <div className="mx-auto w-full max-w-xl px-4 pb-6 pt-4">
      <UserPageHero
        eyebrow="Method"
        title="Build the knowledge behind your program"
        description="A practical field guide to the principles behind sustainable progress."
        icon={<BookOpenText aria-hidden="true" focusable="false" size={17} />}
      />

      <section className="mt-6" aria-labelledby="handbook-title">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-accent)]">Volume 01</p>
            <h2 id="handbook-title" className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[var(--color-text)]">
              The Primal Handbook
            </h2>
          </div>
          <span className="text-xs text-[var(--color-text-muted)]">18 pages</span>
        </div>

        <button
          type="button"
          onClick={() => onOpen()}
          className={`${styles.bookStage} group relative mt-5 block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]`}
          aria-label="Open The Primal Handbook"
        >
          <span className={styles.bookGlow} />
          <span className={`${styles.book} !mx-0 !w-[min(47vw,188px)]`}>
            <span className={`${styles.cover} flex h-full flex-col px-7 pb-6 pt-7`}>
              <span className="relative z-10 whitespace-nowrap text-[7px] font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">
                Primal Power
              </span>
              <span
                className={`${styles.emboss} relative z-10 mt-auto block font-serif text-[1.75rem] font-bold leading-[0.84] tracking-[-0.055em]`}
              >
                THE
                <br />
                PRIMAL
                <br />
                HANDBOOK
              </span>
              <span className="relative z-10 mt-4 h-px w-9 bg-[var(--color-accent)]" />
              <span className={`${styles.emboss} relative z-10 mt-4 text-[7px] font-bold uppercase tracking-[0.22em]`}>
                Train · Fuel · Recover
              </span>
              <span className="relative z-10 mt-3 text-[8px] font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">
                Vol. 01
              </span>
            </span>
          </span>
          <span className="absolute bottom-3 right-0 inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-text)] transition-transform group-hover:translate-x-1">
            {hasProgress ? 'Continue reading' : 'Open handbook'}{' '}
            <ArrowUpRight aria-hidden="true" focusable="false" size={16} className="text-[var(--color-accent)]" />
          </span>
        </button>

        {hasProgress ? (
          <button
            type="button"
            onClick={() => onOpen()}
            className="mt-5 flex w-full items-center justify-between border-y border-[var(--color-border)] py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]"
          >
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                Continue reading
              </span>
              <span className="mt-1 block text-sm font-medium text-[var(--color-text)]">
                Chapter {currentPage?.chapterNumber ?? '—'} · {currentPage?.chapterLabel}
              </span>
            </span>
            <span className="text-xs tabular-nums text-[var(--color-text-muted)]">{progress}%</span>
          </button>
        ) : null}
      </section>

      <section className="mt-8 border-t border-[var(--color-border)] pt-6" aria-labelledby="about-handbook-title">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-accent)]">
          About this handbook
        </p>
        <h2
          id="about-handbook-title"
          className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--color-text)]"
        >
          Understand the whole system.
        </h2>
        <p className="mt-3 max-w-[35rem] text-sm leading-6 text-[var(--color-text-muted)]">
          Learn how training, nutrition, recovery, tracking, and thoughtful adjustment work together—so you can make
          better decisions instead of chasing random fixes.
        </p>
      </section>
    </div>
  );
}
