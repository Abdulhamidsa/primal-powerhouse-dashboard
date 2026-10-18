'use client';

import { useRef, useState } from 'react';
import {
  ArrowRightIcon as ArrowRight,
  BarbellIcon as Barbell,
  CheckCircleIcon as CheckCircle,
  CheckIcon as Check,
  FlameIcon as Flame,
  ForkKnifeIcon as ForkKnife,
} from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUserOnboarding } from '@/features/user-onboarding/hooks/useUserOnboarding';

type WelcomeOnboardingDialogProps = {
  initialOpen: boolean;
};

const TOTAL_STEPS = 3;

export function WelcomeOnboardingDialog({ initialOpen }: WelcomeOnboardingDialogProps) {
  const [open, setOpen] = useState(initialOpen);
  const [step, setStep] = useState(0);
  const completionInFlight = useRef(false);
  const { complete, error, isCompleting } = useUserOnboarding();

  async function finish() {
    if (completionInFlight.current || !open) return;

    completionInFlight.current = true;
    try {
      await complete();
      setOpen(false);
    } catch {
      completionInFlight.current = false;
    }
  }

  function next() {
    if (step < TOTAL_STEPS - 1) {
      setStep(current => current + 1);
      return;
    }
    void finish();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (nextOpen) {
          setOpen(true);
          return;
        }
        void finish();
      }}
    >
      <DialogContent className="max-w-md overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-0 shadow-[0_24px_90px_rgba(0,0,0,0.35)]">
        <div className="px-5 pb-5 pt-7 sm:px-7 sm:pb-7 sm:pt-8">
          <DialogHeader className="text-left">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
                {step === 0 ? <Flame size={22} aria-hidden="true" /> : step === 1 ? <CheckCircle size={22} aria-hidden="true" /> : <ArrowRight size={22} aria-hidden="true" />}
              </span>
              <div className="flex gap-1.5" aria-label={`Step ${step + 1} of ${TOTAL_STEPS}`}>
                {Array.from({ length: TOTAL_STEPS }, (_, index) => (
                  <span
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${index === step ? 'w-7 bg-[var(--color-accent)]' : 'w-1.5 bg-[var(--color-bg-alt)]'}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
            <DialogTitle className="text-[26px] leading-tight tracking-[-0.03em] text-[var(--color-text)]">
              {step === 0 ? 'You’re in.' : step === 1 ? 'Your program, in one place.' : 'Start with today.'}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              {step === 0
                ? 'Welcome to your 4-week starter program. You now have a clear structure for training, nutrition, and daily progress.'
                : step === 1
                  ? 'You get a simple meal plan, structured training sessions, and quick daily tracking to help you stay consistent.'
                  : 'Open your plan, complete what is scheduled, and keep building momentum one day at a time.'}
            </DialogDescription>
          </DialogHeader>

          {step === 1 ? (
            <div className="mt-6 space-y-2.5">
              <Benefit icon={<ForkKnife size={18} aria-hidden="true" />} label="A ready-to-follow meal plan" />
              <Benefit icon={<Barbell size={18} aria-hidden="true" />} label="Structured training for the next 4 weeks" />
              <Benefit icon={<Check size={18} aria-hidden="true" />} label="Simple daily progress tracking" />
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3.5 text-sm leading-6 text-[var(--color-text-muted)]">
              {step === 0
                ? 'Everything you need to get started is waiting inside your dashboard.'
                : 'Your best results come from small actions repeated consistently.'}
            </div>
          )}

          {error ? (
            <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter className="mt-7 flex-row items-center justify-between gap-3 sm:space-x-0">
            <span className="text-xs text-[var(--color-text-muted)]">{step + 1} of {TOTAL_STEPS}</span>
            <Button type="button" onClick={next} disabled={isCompleting} className="min-w-32">
              {isCompleting ? 'Saving…' : step === TOTAL_STEPS - 1 ? 'Start my program' : 'Next'}
              {!isCompleting ? <ArrowRight size={17} aria-hidden="true" /> : null}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Benefit({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-3 text-sm font-medium text-[var(--color-text)]">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
