'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useResendVerificationAction } from '../hooks/useAuthForms';

export function VerifyRequiredForm() {
  const params = useSearchParams();
  const initialEmail = params.get('email') ?? '';
  const [email, setEmail] = useState(initialEmail);
  const { run, loading, error, result } = useResendVerificationAction();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Verify your email before entering the app. If you need a new link, send another verification email.</p>
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); void run({ email }); }}>
        <input className="w-full rounded-xl border border-border bg-background px-4 py-3" placeholder="Email" type="email" value={email} onChange={event => setEmail(event.target.value)} required />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result?.message && <p className="text-sm text-muted-foreground">{result.message}</p>}
        <button disabled={loading} className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60">
          {loading ? 'Sending…' : 'Resend verification email'}
        </button>
      </form>
      <p className="text-center text-sm"><a href="/user/login" className="text-primary">Back to sign in</a></p>
    </div>
  );
}
