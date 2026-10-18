'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRightIcon, EnvelopeSimpleIcon, EyeIcon, EyeSlashIcon, GoogleLogoIcon, LockKeyIcon } from '@phosphor-icons/react';
import { AuthShell } from '@/features/self-signup/components/AuthShell';

const inputClassName = 'min-h-12 w-full rounded-xl border border-border bg-background/70 px-4 py-3 pl-11 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10';

export default function UserLoginClient() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const canSubmit = useMemo(() => {
    return identifier.trim().length > 0 && password.trim().length > 0 && !loading;
  }, [identifier, password, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier, password, rememberMe }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {}

      if (!response.ok) {
        if (data?.requiresVerification && data?.email) {
          router.replace(`/user/verify-required?email=${encodeURIComponent(data.email)}`);
          return;
        }
        const errorMessage = data?.details ? `${data?.error}: ${data?.details}` : data?.error || 'Login failed';
        throw new Error(errorMessage);
      }

      // Store user type in localStorage for PWA
      localStorage.setItem('userType', 'client');

      router.replace('/user/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to your dashboard.">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-3.5">
          <div className="space-y-2">
            <label htmlFor="identifier" className="text-sm font-medium text-foreground">Email or username</label>
            <div className="relative">
              <EnvelopeSimpleIcon size={19} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input id="identifier" name="identifier" type="text" autoComplete="username" required value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="you@example.com" className={inputClassName} />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <LockKeyIcon size={19} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" className={`${inputClassName} pr-12`} />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted/60 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeSlashIcon size={19} aria-hidden="true" /> : <EyeIcon size={19} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"><p className="text-sm text-destructive">{error}</p></div>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <label className="flex min-h-11 select-none items-center gap-2 text-sm text-foreground">
            <input id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary" />
            Remember me
          </label>
          <a href="/user/forgot-password" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Forgot password?</a>
        </div>

        <button type="submit" disabled={!canSubmit} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-[0_8px_20px_rgba(196,123,89,0.16)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Signing in…' : 'Sign in'}
          {!loading && <ArrowRightIcon size={19} aria-hidden="true" />}
        </button>

        <div className="relative py-1"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">or continue with</span></div></div>

        <a href="/api/auth/google/start" className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-background/40 px-4 py-3 text-base font-semibold text-foreground transition hover:border-border-strong hover:bg-muted/40">
          <GoogleLogoIcon size={19} weight="bold" aria-hidden="true" />
          Continue with Google
        </a>

        <p className="text-center text-xs leading-5 text-muted-foreground">By continuing, you agree to our <Link href="/legal/terms" className="text-primary underline-offset-4 hover:underline">Terms</Link> and <Link href="/legal/privacy" className="text-primary underline-offset-4 hover:underline">Privacy Policy</Link>.</p>
        <p className="pt-1 text-center text-sm text-muted-foreground">New here? <a href="/user/signup" className="font-semibold text-primary underline-offset-4 hover:underline">Create a free account</a></p>
      </form>
    </AuthShell>
  );
}
