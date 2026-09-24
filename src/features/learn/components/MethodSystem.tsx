'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown, RotateCw } from 'lucide-react';
import { METHOD_STAGES } from '@/features/learn/data/method';
import type { MethodStage } from '@/features/learn/types/learn.types';
import { cn } from '@/lib/utils';

export function MethodSystem() {
  const [activeId, setActiveId] = useState<MethodStage['id']>('train');
  const reduceMotion = useReducedMotion();

  return (
    <section className="px-4 py-3">
      <div className="mx-auto max-w-xl rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">The system</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-text)]">The Primal Method</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">Five connected practices. Tap each stage to see its job.</p>
        <div className="mt-5 space-y-2">
              {METHOD_STAGES.map((stage, index) => {
                const Icon = stage.icon;
                const active = stage.id === activeId;
                return (
                  <div key={stage.id} className="relative">
                    <button type="button" aria-expanded={active} onClick={() => setActiveId(stage.id)} className={cn('flex min-h-[58px] w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors', active ? 'border-[var(--color-accent)]/45 bg-[var(--color-accent-translucent)] text-[var(--color-text)]' : 'border-[var(--color-border)] bg-[var(--color-bg)]/65 text-[var(--color-text-muted)]', 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]')}>
                      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', active ? 'bg-[var(--color-bg)] text-[var(--color-accent)]' : 'bg-[var(--color-bg-alt)]')}><Icon size={16} /></span>
                      <span className="w-5 font-mono text-[9px] font-bold text-[var(--color-accent)]">{stage.number}</span>
                      <span className="flex-1 text-sm font-bold uppercase tracking-[0.18em]">{stage.label}</span>
                      {index < METHOD_STAGES.length - 1 ? <ChevronDown size={15} className={active ? 'rotate-180 text-[var(--color-accent)]' : ''} /> : <RotateCw size={15} className={active ? 'text-[var(--color-accent)]' : ''} />}
                    </button>
                    <AnimatePresence initial={false}>
                      {active ? (
                        <motion.div initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }} transition={{ duration: reduceMotion ? 0.08 : 0.25 }} className="overflow-hidden">
                          <StageDetail stage={stage} compact />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
        </div>
      </div>
    </section>
  );
}

function StageDetail({ stage, compact = false }: { stage: MethodStage; compact?: boolean }) {
  return (
    <div className={compact ? 'mx-2 border-x border-b border-[var(--color-border)] bg-[var(--color-bg)]/55 px-4 py-4' : ''}>
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
