'use client';

import { ArrowUpRight } from 'lucide-react';
import styles from './learn.module.css';

export function HandbookCover({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="relative overflow-hidden border-y border-[var(--color-border)] py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--color-accent-translucent),transparent_42%)] opacity-70" />
      <div className="relative mx-auto grid max-w-5xl items-center gap-14 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div className="max-w-md">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">Primal knowledge · Volume 01</p>
          <h1 className="mt-5 text-4xl font-semibold leading-[0.95] tracking-[-0.055em] text-[var(--color-text)] sm:text-6xl">The Primal Handbook</h1>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Training · Nutrition · Recovery</p>
          <p className="mt-6 max-w-[38ch] text-sm leading-7 text-[var(--color-text-muted)]">A field manual for building strength, directing nutrition, recovering with intent, and making decisions from evidence.</p>
          <button type="button" onClick={onOpen} className="group mt-8 inline-flex min-h-12 items-center gap-3 border-b border-[var(--color-accent)] pb-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]">
            Open handbook <ArrowUpRight size={17} className="text-[var(--color-accent)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
          </button>
        </div>

        <button type="button" onClick={onOpen} aria-label="Open The Primal Handbook" className={`${styles.bookStage} relative mx-auto block w-full max-w-lg py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[var(--color-accent)]`}>
          <span className={styles.bookGlow} />
          <span className={styles.book}>
            <span className={`${styles.cover} flex flex-col px-10 pb-9 pt-10 text-left sm:px-12 sm:pb-11 sm:pt-12`}>
              <span className="relative z-10 text-[8px] font-bold uppercase tracking-[0.32em] text-[var(--color-accent)]">Primal Power</span>
              <span className={`${styles.emboss} relative z-10 mt-auto block font-serif text-[2.6rem] font-bold leading-[0.84] tracking-[-0.055em] sm:text-5xl`}>THE<br />PRIMAL<br />HANDBOOK</span>
              <span className="relative z-10 mt-6 h-px w-10 bg-[var(--color-accent)]" />
              <span className={`${styles.emboss} relative z-10 mt-5 text-[8px] font-bold uppercase tracking-[0.26em]`}>Train · Fuel · Recover · Grow</span>
              <span className="relative z-10 mt-3 text-[8px] font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">Vol. 01</span>
            </span>
          </span>
        </button>
      </div>
    </section>
  );
}
