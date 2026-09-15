'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useResetPasswordAction } from '../hooks/useAuthForms';

export function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const { run, loading, error, result } = useResetPasswordAction();

  return (
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); void run({ token, password }); }}>
      <input className="w-full rounded-xl border border-border bg-background px-4 py-3" placeholder="New password" type="password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} required />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result?.message && <p className="text-sm text-muted-foreground">{result.message}</p>}
      <button disabled={loading || !token} className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60">
        {loading ? 'Resetting…' : 'Reset password'}
      </button>
      <p className="text-center text-sm">
        <a href={result?.sessionKept ? '/user/profile' : '/user/login'} className="text-primary">
          {result?.sessionKept ? 'Back to profile' : 'Back to sign in'}
        </a>
      </p>
    </form>
  );
}
