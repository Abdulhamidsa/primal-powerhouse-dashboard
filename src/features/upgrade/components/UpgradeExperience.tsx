'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, CircleDot } from 'lucide-react';
import { COACHED_ITEMS, COACHING_DIFFERENCES, SELF_GUIDED_ITEMS } from '@/features/upgrade/data/coaching';

export function UpgradeExperience() {
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: 0.35 } };

  return (
    <div className="bg-[var(--color-bg)] px-4 pb-32 pt-4 text-[var(--color-text)]">
      <div className="mx-auto max-w-xl space-y-3">
        <motion.section {...reveal} className="relative overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,var(--color-accent-translucent),transparent_38%)]" />
          <div className="relative">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]"><CircleDot size={13} /> Primal · 1:1</p>
            <h1 className="mt-3 text-[2rem] font-semibold leading-[0.95] tracking-[-0.055em]">Make the program personal.</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">Your starter program gives you the structure. Personal guidance adjusts that structure around your progress, schedule, and goal.</p>
            <Link href="/user/chat" className="mt-5 flex min-h-12 items-center justify-between rounded-2xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-text-on-accent)] transition-transform active:scale-[0.99]">
              I’m ready <ArrowRight size={17} />
            </Link>
          </div>
        </motion.section>

        <motion.section {...reveal} className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">What changes</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">From self-guided to guided.</h2>
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] gap-2">
            <ComparisonColumn label="Now" items={SELF_GUIDED_ITEMS} muted />
            <div className="flex items-center"><ArrowRight size={16} className="text-[var(--color-accent)]" /></div>
            <ComparisonColumn label="1:1" items={COACHED_ITEMS} />
          </div>
        </motion.section>

        <section className="space-y-3">
          {COACHING_DIFFERENCES.map(item => {
            const Icon = item.icon;
            return (
              <motion.article key={item.number} {...reveal} className="rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]"><Icon size={17} /></span>
                  <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{item.number} · {item.eyebrow}</p><h3 className="mt-1 text-lg font-semibold tracking-[-0.025em]">{item.title}</h3></div>
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">{item.copy}</p>
              </motion.article>
            );
          })}
        </section>

        <motion.section {...reveal} className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">Ready when you are</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Take the next step.</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">Tell us you’re ready and we’ll contact you using the details on your account.</p>
          <p className="mt-5 flex items-center gap-2 border-t border-[var(--color-border)] pt-4 text-xs font-semibold text-[var(--color-text-muted)]"><Check size={15} className="text-[var(--color-accent)]" /> One request. A personal follow-up.</p>
        </motion.section>
      </div>
    </div>
  );
}

function ComparisonColumn({ label, items, muted = false }: { label: string; items: string[]; muted?: boolean }) {
  return (
    <div>
      <p className={`text-[9px] font-bold uppercase tracking-[0.18em] ${muted ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-accent)]'}`}>{label}</p>
      <div className="mt-2 space-y-2">
        {items.slice(0, 5).map(item => <p key={item} className={`flex gap-1.5 text-[10px] leading-4 ${muted ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text)]'}`}><Check size={11} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />{item}</p>)}
      </div>
    </div>
  );
}
