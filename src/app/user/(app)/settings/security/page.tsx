'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CaretLeftIcon as ChevronLeft, KeyIcon as KeyRound, EnvelopeSimpleIcon as Mail } from '@phosphor-icons/react';
import { SkeletonUserProfile } from '@/components/Skeletons';
import { useRecoveryEmail, useUserPasswordLink, useUserProfile } from '@/features/user-profile/hooks/useUserProfile';

export default function UserSecuritySettingsPage() {
  const { user, isLoading } = useUserProfile();
  const {
    sendPasswordLink,
    loading: isSendingPasswordLink,
    error: passwordLinkError,
    result: passwordLinkResult,
  } = useUserPasswordLink();
  const { save: saveRecoveryEmail, loading: isSavingRecoveryEmail, error: recoveryEmailError, result: recoveryEmailResult } = useRecoveryEmail();
  const [recoveryEmail, setRecoveryEmail] = useState('');

  if (isLoading) return <SkeletonUserProfile />;

  const handleSendPasswordLink = async () => {
    try {
      await sendPasswordLink();
    } catch {}
  };

  const handleRecoveryEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    try { await saveRecoveryEmail(recoveryEmail); } catch {}
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md space-y-6 px-4 pb-32 pt-5">
        <Link
          href="/user/profile"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground"
        >
          <ChevronLeft aria-hidden="true" focusable="false" className="h-4 w-4" />
          Profile
        </Link>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Settings</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Account Security</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage password access without changing your Google sign-in.
          </p>
        </div>

        <section className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-muted/50">
              <KeyRound aria-hidden="true" focusable="false" className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Password</p>
              <p className="text-xs text-muted-foreground">
                {user?.hasPassword ? 'Password configured' : 'No password configured'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSendPasswordLink}
              disabled={isSendingPasswordLink}
              className="rounded-2xl border border-border px-3 py-2 text-xs font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSendingPasswordLink ? 'Sending…' : user?.hasPassword ? 'Change' : 'Set'}
            </button>
          </div>

          <div className="border-t border-border/60 px-4 py-4">
            <div className="flex items-start gap-3 rounded-2xl bg-muted/25 p-3">
              <Mail aria-hidden="true" focusable="false" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs leading-5 text-muted-foreground">
                {user?.email ? `We send a secure email link to ${user.email}.` : 'Add a recovery email to receive secure password links and recover your account.'} Password changes are never done directly inside the logged-in session.
              </p>
            </div>
            {passwordLinkResult?.message ? (
              <p className="mt-3 text-xs text-emerald-600">{passwordLinkResult.message}</p>
            ) : null}
            {passwordLinkError ? <p className="mt-3 text-xs text-destructive">{passwordLinkError}</p> : null}
          </div>
        </section>

        {!user?.email || !user.emailVerifiedAt ? (
          <section className="space-y-3 rounded-3xl border border-border bg-card p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Recovery email</p>
              <p className="mt-1 text-xs text-muted-foreground">We’ll verify this address before it can be used to sign in.</p>
            </div>
            <form className="space-y-3" onSubmit={handleRecoveryEmail}>
              <input type="email" required value={recoveryEmail} onChange={event => setRecoveryEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              <button type="submit" disabled={isSavingRecoveryEmail} className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{isSavingRecoveryEmail ? 'Sending…' : 'Add recovery email'}</button>
              {recoveryEmailResult?.message ? <p className="text-xs text-emerald-600">{recoveryEmailResult.message}</p> : null}
              {recoveryEmailError ? <p className="text-xs text-destructive">{recoveryEmailError}</p> : null}
            </form>
          </section>
        ) : null}
      </div>
    </div>
  );
}
