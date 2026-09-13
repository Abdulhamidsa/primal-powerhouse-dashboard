'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserLoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0 && !loading;
  }, [email, password, loading]);

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
        body: JSON.stringify({ email, password, rememberMe }),
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card/80 backdrop-blur p-6 sm:p-8 shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to continue to your dashboard</p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  className="
                      w-full rounded-xl border border-border bg-background
                      px-4 py-3 text-base text-foreground
                      placeholder:text-muted-foreground
                      focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
                      transition
                    "
                />
              </div>

              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="
                      w-full rounded-xl border border-border bg-background
                      px-4 py-3 pr-14 text-base text-foreground
                      placeholder:text-muted-foreground
                      focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
                      transition
                    "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="
                      absolute right-2 top-1/2 -translate-y-1/2
                      rounded-lg px-2 py-1 text-sm
                      text-muted-foreground hover:text-foreground
                      transition
                    "
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-foreground select-none">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                Remember me
              </label>

              <a href="/user/forgot-password" className="text-sm text-primary hover:underline underline-offset-4">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="
                  w-full rounded-xl px-4 py-3 text-base font-medium
                  bg-primary text-primary-foreground
                  hover:opacity-95
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition
                "
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <a
              href="/api/auth/google/start"
              className="block w-full rounded-xl border border-border px-4 py-3 text-center text-base font-medium text-foreground hover:bg-muted transition"
            >
              Continue with Google
            </a>

            <p className="text-center text-sm text-muted-foreground">By continuing, you agree to the app policies.</p>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          New here? <a href="/user/signup" className="text-primary hover:underline">Create a free account</a>
        </p>
      </div>
    </div>
  );
}
