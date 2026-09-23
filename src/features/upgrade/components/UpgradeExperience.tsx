'use client';

import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowRight, Check, CircleDot, MoveRight } from 'lucide-react';
import { COACHED_ITEMS, COACHING_DIFFERENCES, SELF_GUIDED_ITEMS } from '@/features/upgrade/data/coaching';

const revealViewport = { once: true, amount: 0.25 } as const;

export function UpgradeExperience() {
  const [noticeVisible, setNoticeVisible] = useState(false);
  const noticeRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion ? {} : { initial: { opacity: 0, y: 22 }, whileInView: { opacity: 1, y: 0 }, viewport: revealViewport, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } };

  const showNotice = () => {
    setNoticeVisible(true);
    window.requestAnimationFrame(() => noticeRef.current?.focus());
  };

  return (
    <div className="overflow-x-clip bg-[var(--color-bg)] pb-28 text-[var(--color-text)]">
      <section className="relative min-h-[min(760px,calc(100dvh-8rem))] overflow-hidden border-b border-[var(--color-border)] px-4 py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,var(--color-accent-translucent),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-[18%] hidden w-px bg-gradient-to-b from-transparent via-[var(--color-accent)]/30 to-transparent lg:block" />
        <div className="relative mx-auto flex min-h-[inherit] max-w-5xl flex-col justify-center">
          <motion.div {...reveal} className="max-w-4xl">
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]"><CircleDot size={14} /> Primal Coaching · 1:1</div>
            <h1 className="mt-7 text-[clamp(3rem,9vw,7.8rem)] font-semibold leading-[0.82] tracking-[-0.075em] text-[var(--color-text)]">You’ve got<br />the plan.<br /><span className="text-[var(--color-text-muted)]">Now get the coach.</span></h1>
            <div className="mt-9 grid max-w-2xl gap-6 border-t border-[var(--color-border)] pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <p className="max-w-md text-sm leading-7 text-[var(--color-text-muted)]">The starter experience gives you the system. Coaching makes that system personal—and keeps it responsive when your life, body, or goal changes.</p>
              <button type="button" onClick={showNotice} aria-expanded={noticeVisible} className="group inline-flex min-h-12 items-center justify-between gap-5 border-b border-[var(--color-accent)] pb-2 text-xs font-bold uppercase tracking-[0.18em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-accent)]">Apply for coaching <MoveRight size={18} className="text-[var(--color-accent)] transition-transform group-hover:translate-x-1" /></button>
            </div>
            {noticeVisible ? (
              <motion.div ref={noticeRef} role="status" tabIndex={-1} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 max-w-2xl border-l-2 border-[var(--color-accent)] bg-[var(--color-accent-translucent)] px-4 py-3 outline-none">
                <p className="text-sm font-semibold">Coaching applications are coming soon.</p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">We’re preparing the application experience. Nothing has been submitted.</p>
              </motion.div>
            ) : null}
          </motion.div>
          <div className="absolute bottom-6 right-0 hidden items-center gap-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[var(--color-text-muted)] sm:flex"><ArrowDown size={14} className="text-[var(--color-accent)]" /> See what changes</div>
        </div>
      </section>

      <section className="border-b border-[var(--color-border)] px-4 py-20 sm:py-28">
        <motion.div {...reveal} className="mx-auto max-w-5xl">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">From system to service</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">The plan becomes personal.</h2></div>
            <p className="hidden max-w-xs text-right text-xs leading-5 text-[var(--color-text-muted)] sm:block">Same fundamentals. More context, review, and accountability.</p>
          </div>
          <div className="relative grid overflow-hidden border border-[var(--color-border)] lg:grid-cols-[1fr_auto_1fr]">
            <TransitionColumn label="Self-guided" items={SELF_GUIDED_ITEMS} muted />
            <div className="relative z-10 flex min-h-16 items-center justify-center border-y border-[var(--color-border)] bg-[var(--color-bg)] px-6 lg:border-x lg:border-y-0">
              <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--color-border)] lg:inset-y-0 lg:left-1/2 lg:h-auto lg:w-px" />
              <span className="relative grid h-11 w-11 place-items-center rounded-full border border-[var(--color-accent)] bg-[var(--color-bg)] text-[var(--color-accent)]"><ArrowRight size={18} className="rotate-90 lg:rotate-0" /></span>
            </div>
            <TransitionColumn label="Coached" items={COACHED_ITEMS} />
          </div>
        </motion.div>
      </section>

      <section className="px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <motion.div {...reveal} className="mb-12 max-w-xl"><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">What changes</p><h2 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-6xl">Guidance enters the loop.</h2></motion.div>
          <div className="border-t border-[var(--color-border)]">
            {COACHING_DIFFERENCES.map(item => {
              const Icon = item.icon;
              return (
                <motion.article key={item.number} {...reveal} className="group grid gap-6 border-b border-[var(--color-border)] py-10 sm:grid-cols-[4rem_1fr] sm:py-14 lg:grid-cols-[5rem_1.15fr_0.85fr] lg:items-start">
                  <span className="font-mono text-[10px] font-bold text-[var(--color-accent)]">{item.number}</span>
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-muted)]">{item.eyebrow}</p><h3 className="mt-2 max-w-[13ch] text-3xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-5xl">{item.title}</h3></div>
                  <div className="sm:col-start-2 lg:col-start-auto"><div className="mb-4 grid h-10 w-10 place-items-center rounded-full border border-[var(--color-border)] text-[var(--color-accent)] transition-colors group-hover:border-[var(--color-accent)]"><Icon size={17} /></div><p className="text-sm leading-7 text-[var(--color-text-muted)]">{item.copy}</p><p className="mt-5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-text)]"><span className="h-px w-6 bg-[var(--color-accent)]" />{item.signal}</p></div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 pt-14 sm:pb-16 sm:pt-24">
        <motion.div {...reveal} className="relative mx-auto max-w-5xl overflow-hidden border-y border-[var(--color-border)] py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,var(--color-accent-translucent),transparent_34%)]" />
          <div className="relative max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">Ready when you are</p>
            <h2 className="mt-5 text-4xl font-semibold leading-[0.92] tracking-[-0.055em] sm:text-7xl">The system works.<br />Coaching makes it yours.</h2>
            <p className="mt-7 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]"><Check size={15} className="text-[var(--color-accent)]" /> Applications opening soon</p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function TransitionColumn({ label, items, muted = false }: { label: string; items: string[]; muted?: boolean }) {
  return (
    <div className={`p-6 sm:p-8 ${muted ? 'bg-[var(--color-bg)]' : 'bg-[var(--color-surface)]'}`}>
      <p className={`text-[10px] font-bold uppercase tracking-[0.26em] ${muted ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-accent)]'}`}>{label}</p>
      <div className="mt-7 space-y-0">
        {items.map((item, index) => <div key={item} className="flex min-h-11 items-center gap-3 border-t border-[var(--color-border)] py-2.5 last:border-b"><span className={`font-mono text-[9px] ${muted ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-accent)]'}`}>{String(index + 1).padStart(2, '0')}</span><span className={`text-sm ${muted ? 'text-[var(--color-text-muted)]' : 'font-semibold text-[var(--color-text)]'}`}>{item}</span></div>)}
      </div>
    </div>
  );
}
