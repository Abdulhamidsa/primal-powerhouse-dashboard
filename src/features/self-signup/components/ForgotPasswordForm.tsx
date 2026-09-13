'use client';

import { useState } from 'react';
import { useForgotPasswordAction } from '../hooks/useAuthForms';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const { run, loading, error, result } = useForgotPasswordAction();

  return (
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); void run({ email }); }}>
      <input className="w-full rounded-xl border border-border bg-background px-4 py-3" placeholder="Email" type="email" value={email} onChange={event => setEmail(event.target.value)} required />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result?.message && <p className="text-sm text-muted-foreground">{result.message}</p>}
      <button disabled={loading} className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60">
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
      <p className="text-center text-sm"><a href="/user/login" className="text-primary">Back to sign in</a></p>
    </form>
  );
}
