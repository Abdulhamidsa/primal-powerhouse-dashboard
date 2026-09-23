'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowDown, RotateCw } from 'lucide-react';
import { METHOD_STAGES } from '@/features/learn/data/method';
import type { MethodStage } from '@/features/learn/types/learn.types';
import { cn } from '@/lib/utils';
import styles from './learn.module.css';

export function MethodSystem() {
  const [activeId, setActiveId] = useState<MethodStage['id']>('train');
  const reduceMotion = useReducedMotion();
  const activeStage = METHOD_STAGES.find(stage => stage.id === activeId) ?? METHOD_STAGES[0];

  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)] px-4 py-20 sm:py-28">
      <div className={`${styles.blueprint} pointer-events-none absolute inset-0 opacity-80`} />
      <div className="relative mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">The operating system</p>
            <h2 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-[-0.05em] text-[var(--color-text)] sm:text-6xl">The Primal Method</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-[var(--color-text-muted)]">Your progress is not a collection of random actions. It is a loop: create the stimulus, support the response, collect evidence, then adapt.</p>
            <div className="mt-8 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]"><RotateCw size={15} className="text-[var(--color-accent)]" /> Evidence closes the loop</div>
          </div>

          <div className="relative">
            <div className="absolute bottom-8 left-[25px] top-8 w-px bg-gradient-to-b from-[var(--color-accent)] via-[var(--color-border)] to-[var(--color-accent)] sm:left-[31px]" />
            <div className="space-y-2">
              {METHOD_STAGES.map((stage, index) => {
                const Icon = stage.icon;
                const active = stage.id === activeId;
                return (
                  <div key={stage.id} className="relative">
                    <button type="button" aria-expanded={active} onClick={() => setActiveId(stage.id)} className={cn('relative z-10 flex min-h-[66px] w-full items-center gap-4 border px-3 py-3 text-left transition-colors sm:px-4', active ? 'border-[var(--color-accent)]/45 bg-[var(--color-surface)] text-[var(--color-text)]' : 'border-[var(--color-border)] bg-[var(--color-bg)]/80 text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/25 hover:text-[var(--color-text)]', 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]')}>
                      <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-[var(--color-bg)]', active ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)]')}><Icon size={17} /></span>
                      <span className="w-7 font-mono text-[9px] font-bold text-[var(--color-accent)]">{stage.number}</span>
                      <span className="flex-1 text-sm font-bold uppercase tracking-[0.18em]">{stage.label}</span>
                      {index < METHOD_STAGES.length - 1 ? <ArrowDown size={15} className={active ? 'text-[var(--color-accent)]' : ''} /> : <RotateCw size={15} className={active ? 'text-[var(--color-accent)]' : ''} />}
                    </button>
                    <AnimatePresence initial={false}>
                      {active ? (
                        <motion.div initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }} transition={{ duration: reduceMotion ? 0.08 : 0.3 }} className="overflow-hidden lg:hidden">
                          <StageDetail stage={stage} compact />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 hidden border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-7 lg:block">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={activeStage.id} initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0.08 : 0.25 }}>
              <StageDetail stage={activeStage} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function StageDetail({ stage, compact = false }: { stage: MethodStage; compact?: boolean }) {
  return (
    <div className={compact ? 'border-x border-b border-[var(--color-border)] bg-[var(--color-surface)]/70 px-4 py-5' : 'grid gap-8 md:grid-cols-[1fr_auto] md:items-end'}>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-accent)]">Stage {stage.number} · {stage.label}</p>
        <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[var(--color-text)] sm:text-2xl">{stage.statement}</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">{stage.detail}</p>
      </div>
      <div className={`mt-5 flex flex-wrap gap-2 ${compact ? '' : 'md:mt-0 md:justify-end'}`}>
        {stage.concepts.map(concept => <span key={concept} className="border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{concept}</span>)}
      </div>
    </div>
  );
}
