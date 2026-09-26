'use client';

import Link from 'next/link';
import { CaretLeftIcon as ChevronLeft, KeyIcon as KeyRound, EnvelopeSimpleIcon as Mail } from '@phosphor-icons/react';
import { SkeletonUserProfile } from '@/components/Skeletons';
import { useUserPasswordLink, useUserProfile } from '@/features/user-profile/hooks/useUserProfile';

export default function UserSecuritySettingsPage() {
  const { user, isLoading } = useUserProfile();
  const {
    sendPasswordLink,
    loading: isSendingPasswordLink,
    error: passwordLinkError,
    result: passwordLinkResult,
  } = useUserPasswordLink();

  if (isLoading) return <SkeletonUserProfile />;

  const handleSendPasswordLink = async () => {
    try {
      await sendPasswordLink();
    } catch {}
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
                We send a secure email link to {user?.email ?? 'your email'}. Password changes are never done directly
                inside the logged-in session.
              </p>
            </div>
            {passwordLinkResult?.message ? (
              <p className="mt-3 text-xs text-emerald-600">{passwordLinkResult.message}</p>
            ) : null}
            {passwordLinkError ? <p className="mt-3 text-xs text-destructive">{passwordLinkError}</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
