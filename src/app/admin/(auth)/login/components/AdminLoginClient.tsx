'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {}

      if (!response.ok) {
        const errorMessage = data?.details ? `${data?.error}: ${data?.details}` : data?.error || 'Login failed';
        throw new Error(errorMessage);
      }

      localStorage.setItem('userType', 'admin');
      router.replace('/admin/dashboard');
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
            <h1 className="text-2xl font-semibold text-foreground">Admin Portal</h1>
            <p className="text-sm text-muted-foreground">Sign in to manage your fitness business</p>
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
                  placeholder="Admin email"
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

            <p className="text-center text-sm text-muted-foreground">Authorized personnel only.</p>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">Trouble signing in? Contact support.</p>
      </div>
    </div>
  );
}
