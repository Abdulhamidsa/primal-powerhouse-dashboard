'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CaretLeftIcon as ChevronLeft } from '@phosphor-icons/react';
import { SkeletonUserProfile } from '@/components/Skeletons';
import { useDisplayNameUpdate, useRecoveryEmail, useUserProfile } from '@/features/user-profile/hooks/useUserProfile';
import { getClientDisplayName } from '@/lib/client-display-name';
import { hasVerifiedRecoveryEmail } from '@/lib/auth/recovery-status';

export default function UserAccountSettingsPage() {
  const { user, isLoading } = useUserProfile();
  const { save: saveDisplayName, loading: isSavingDisplayName, error: displayNameError } = useDisplayNameUpdate();
  const {
    save: saveRecoveryEmail,
    loading: isSavingRecoveryEmail,
    error: recoveryEmailError,
    result: recoveryEmailResult,
  } = useRecoveryEmail();
  const [displayName, setDisplayName] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');

  useEffect(() => {
    setDisplayName(user?.name ?? '');
  }, [user?.name]);

  if (isLoading) return <SkeletonUserProfile />;

  const handleDisplayNameSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveDisplayName(displayName);
    } catch {}
  };

  const handleRecoveryEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await saveRecoveryEmail(recoveryEmail);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md space-y-6 px-4 pb-32 pt-5">
        <Link href="/user/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <ChevronLeft aria-hidden="true" focusable="false" className="h-4 w-4" />
          Profile
        </Link>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Settings</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Account Info</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage the identity details connected to your account.</p>
        </div>

        {user ? (
          <>
            <section className="overflow-hidden rounded-3xl border border-border bg-card">
              <form className="space-y-3 border-b border-border/60 px-4 py-4" onSubmit={handleDisplayNameSubmit}>
                <label htmlFor="display-name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Display name</label>
                <div className="flex gap-2">
                  <input
                    id="display-name"
                    value={displayName}
                    onChange={event => setDisplayName(event.target.value)}
                    maxLength={100}
                    placeholder="Your name"
                    className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                  <button type="submit" disabled={isSavingDisplayName} className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                    {isSavingDisplayName ? 'Saving…' : 'Save'}
                  </button>
                </div>
                {displayNameError ? <p className="text-xs text-destructive">{displayNameError}</p> : null}
                <p className="text-xs text-muted-foreground">Shown as {getClientDisplayName(user)} when a label is needed.</p>
              </form>
              <AccountInfoRow label="Username" value={user.username ? `@${user.username}` : 'Not set'} />
              <AccountInfoRow label="Email" value={user.email ?? 'Not added'} />
              <AccountInfoRow label="Recovery" value={hasVerifiedRecoveryEmail(user) ? 'Enabled' : 'Not set up'} />
            </section>

            {!user.email || !user.emailVerifiedAt ? (
              <section className="space-y-3 rounded-3xl border border-border bg-card p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Recovery email</p>
                  <p className="mt-1 text-xs text-muted-foreground">Add an email to recover your account and receive secure password links.</p>
                </div>
                <form className="space-y-3" onSubmit={handleRecoveryEmail}>
                  <input type="email" required value={recoveryEmail} onChange={event => setRecoveryEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                  <button type="submit" disabled={isSavingRecoveryEmail} className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                    {isSavingRecoveryEmail ? 'Sending…' : 'Add recovery email'}
                  </button>
                  {recoveryEmailResult?.message ? <p className="text-xs text-emerald-600">{recoveryEmailResult.message}</p> : null}
                  {recoveryEmailError ? <p className="text-xs text-destructive">{recoveryEmailError}</p> : null}
                </form>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function AccountInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="truncate text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
