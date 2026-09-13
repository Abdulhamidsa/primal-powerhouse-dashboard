'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignupAction } from '../hooks/useAuthForms';

export function SignupForm() {
  const router = useRouter();
  const { run, loading, error } = useSignupAction();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = await run(form);
    router.replace(`/user/verify-required?email=${encodeURIComponent(result.email ?? form.email)}`);
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <input className="w-full rounded-xl border border-border bg-background px-4 py-3" placeholder="Name" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} required />
      <input className="w-full rounded-xl border border-border bg-background px-4 py-3" placeholder="Email" type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} required />
      <input className="w-full rounded-xl border border-border bg-background px-4 py-3" placeholder="Password" type="password" minLength={8} value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} required />
      {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      <button disabled={loading} className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60">
        {loading ? 'Creating account…' : 'Create free account'}
      </button>
      <a href="/api/auth/google/start" className="block w-full rounded-xl border border-border px-4 py-3 text-center font-medium">Continue with Google</a>
      <p className="text-center text-sm text-muted-foreground">Already have an account? <a href="/user/login" className="text-primary">Sign in</a></p>
    </form>
  );
}
