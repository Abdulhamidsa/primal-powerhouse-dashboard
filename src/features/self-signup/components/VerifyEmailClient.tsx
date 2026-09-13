'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useVerifyEmailAction } from '../hooks/useAuthForms';

export function VerifyEmailClient() {
  const token = useSearchParams().get('token') ?? '';
  const { run, loading, error, result } = useVerifyEmailAction();
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!token || started) return;
    setStarted(true);
    void run({ token });
  }, [run, started, token]);

  if (!token) return <p className="text-sm text-destructive">Verification token is missing.</p>;
  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">{loading ? 'Verifying your email…' : result?.message || error}</p>
      {result?.success && <a href="/user/login" className="inline-flex rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground">Sign in</a>}
    </div>
  );
}
