'use client';

import Link from 'next/link';
import {
  ArrowLeftIcon as ArrowLeft,
  CheckIcon as Check,
  LockKeyIcon as LockKeyhole,
  PaperPlaneTiltIcon as Send,
} from '@phosphor-icons/react';
import { useCoachingInterest } from '@/features/coaching-interest/hooks/useCoachingInterest';

export function CoachingInterestScreen() {
  const { interest, isLoading, error, isSubmitting, submitError, submit } = useCoachingInterest();
  const requestedAt = interest?.requestedAt
    ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(interest.requestedAt))
    : null;

  return (
    <div className="h-full overflow-y-auto bg-[var(--color-bg)] px-4 pb-32 pt-4">
      <div className="mx-auto max-w-xl">
        <Link
          href="/user/upgrade"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[var(--color-text-muted)]"
        >
          <ArrowLeft aria-hidden="true" focusable="false" size={17} /> Back
        </Link>
        <section className="mt-2 overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-accent-translucent)] text-[var(--color-accent)]">
            <Send aria-hidden="true" focusable="false" size={20} />
          </div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Personal guidance
          </p>
          <h1 className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.05em] text-[var(--color-text)]">
            Ready for the next step?
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            Send one request to let Primal know you’re interested. This is not a live chat, and there is no message to
            write.
          </p>

          <div className="mt-5 space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]/65 p-4">
            <InfoLine>One fixed request is sent</InfoLine>
            <InfoLine>You cannot add text or attachments</InfoLine>
            <InfoLine>We contact you outside the app using your account details</InfoLine>
          </div>

          {isLoading ? (
            <div className="mt-5 h-12 animate-pulse rounded-2xl bg-[var(--color-bg-alt)]" />
          ) : interest?.requested ? (
            <div
              role="status"
              className="mt-5 rounded-2xl border border-[var(--color-accent)]/35 bg-[var(--color-accent-translucent)] p-4"
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                <Check aria-hidden="true" focusable="false" size={17} className="text-[var(--color-accent)]" /> Request
                received
              </p>
              {requestedAt ? <p className="mt-2 text-xs text-[var(--color-text-muted)]">Sent {requestedAt}</p> : null}
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                We’ll contact you using the details saved on your account.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={isSubmitting}
              className="mt-5 flex min-h-12 w-full items-center justify-between rounded-2xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-text-on-accent)] disabled:opacity-60"
            >
              {isSubmitting ? 'Sending…' : 'I’m ready'} <Send aria-hidden="true" focusable="false" size={17} />
            </button>
          )}

          {error && !interest ? (
            <p role="alert" className="mt-3 text-sm text-red-400">
              Could not check your request status. Refresh and try again.
            </p>
          ) : null}
          {submitError ? (
            <p role="alert" className="mt-3 text-sm text-red-400">
              {submitError}
            </p>
          ) : null}
          <p className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-[var(--color-text-muted)]">
            <LockKeyhole aria-hidden="true" focusable="false" size={14} className="mt-0.5 shrink-0" /> Your normal
            self-service access does not include messaging or conversation history.
          </p>
        </section>
      </div>
    </div>
  );
}

function InfoLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-xs leading-5 text-[var(--color-text-muted)]">
      <Check aria-hidden="true" focusable="false" size={14} className="mt-0.5 shrink-0 text-[var(--color-accent)]" />
      {children}
    </p>
  );
}
