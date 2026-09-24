'use client';

import { ArrowUpRight } from 'lucide-react';
import styles from './learn.module.css';

export function HandbookCover({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="px-4 pb-3 pt-4">
      <div className="relative mx-auto max-w-xl overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 pb-6 pt-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_38%,var(--color-accent-translucent),transparent_38%)] opacity-70" />
        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">Method · Volume 01</p>
          <h1 className="mt-3 text-[1.9rem] font-semibold leading-none tracking-[-0.05em] text-[var(--color-text)]">The Primal Handbook</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">Training, nutrition, recovery, and the decisions that connect them.</p>
        </div>

        <button type="button" onClick={onOpen} aria-label="Open The Primal Handbook" className={`${styles.bookStage} relative mx-auto mt-3 block w-full py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]`}>
          <span className={styles.bookGlow} />
          <span className={styles.book}>
            <span className={`${styles.cover} flex flex-col px-8 pb-7 pt-8 text-left`}>
              <span className="relative z-10 text-[8px] font-bold uppercase tracking-[0.32em] text-[var(--color-accent)]">Primal Power</span>
              <span className={`${styles.emboss} relative z-10 mt-auto block font-serif text-[2rem] font-bold leading-[0.84] tracking-[-0.055em]`}>THE<br />PRIMAL<br />HANDBOOK</span>
              <span className="relative z-10 mt-4 h-px w-9 bg-[var(--color-accent)]" />
              <span className={`${styles.emboss} relative z-10 mt-4 text-[7px] font-bold uppercase tracking-[0.22em]`}>Train · Fuel · Recover · Grow</span>
              <span className="relative z-10 mt-3 text-[8px] font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">Vol. 01</span>
            </span>
          </span>
        </button>
        <button type="button" onClick={onOpen} className="relative flex min-h-12 w-full items-center justify-between rounded-2xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-text-on-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]">
          Open handbook <ArrowUpRight size={17} />
        </button>
      </div>
    </section>
  );
}
