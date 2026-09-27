'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { suggestUsernames } from '../api/auth.api';
import { useSignupAction } from '../hooks/useAuthForms';

type SignupMethod = 'email' | 'username';

export function SignupForm() {
  const router = useRouter();
  const { run, loading, error } = useSignupAction();
  const [method, setMethod] = useState<SignupMethod>('email');
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '' });
  const [suggesting, setSuggesting] = useState(false);
  const [copyLabel, setCopyLabel] = useState('');

  async function makeUsername() {
    setSuggesting(true);
    try {
      const result = await suggestUsernames();
      if (result.suggestions[0]) setForm(prev => ({ ...prev, username: result.suggestions[0] }));
    } finally {
      setSuggesting(false);
    }
  }

  async function copyUsername() {
    if (!form.username || !navigator.clipboard) return;
    await navigator.clipboard.writeText(form.username);
    setCopyLabel('Copied');
    window.setTimeout(() => setCopyLabel(''), 1500);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = method === 'email'
      ? await run({ method: 'email', name: form.name, email: form.email, password: form.password })
      : await run({ method: 'username', name: form.name, username: form.username, password: form.password });
    if (method === 'email') router.replace(`/user/verify-required?email=${encodeURIComponent(result.email ?? form.email)}`);
    else router.replace('/user/dashboard');
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setMethod('email')} className={`rounded-xl border px-3 py-2 text-sm ${method === 'email' ? 'border-primary bg-primary/10' : 'border-border'}`}>Continue with email</button>
        <button type="button" onClick={() => setMethod('username')} className={`rounded-xl border px-3 py-2 text-sm ${method === 'username' ? 'border-primary bg-primary/10' : 'border-border'}`}>Continue with username</button>
      </div>
      <input className="w-full rounded-xl border border-border bg-background px-4 py-3" placeholder="Name" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} required />
      {method === 'email' ? (
        <input className="w-full rounded-xl border border-border bg-background px-4 py-3" placeholder="Email" type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} required />
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3" placeholder="Username" value={form.username} onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))} required />
            <button type="button" onClick={makeUsername} disabled={suggesting} className="rounded-xl border border-border px-3 text-xs">{suggesting ? 'Making…' : 'Make one for me'}</button>
          </div>
          {form.username ? <button type="button" onClick={copyUsername} className="text-xs text-primary">{copyLabel || 'Copy username'}</button> : null}
        </div>
      )}
      <input className="w-full rounded-xl border border-border bg-background px-4 py-3" placeholder="Password" type="password" minLength={8} value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} required />
      {error && <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      <button disabled={loading} className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-60">{loading ? 'Creating account…' : method === 'username' ? 'Create account' : 'Create free account'}</button>
      <a href="/api/auth/google/start" className="block w-full rounded-xl border border-border px-4 py-3 text-center font-medium">Continue with Google</a>
      <p className="text-center text-sm text-muted-foreground">Already have an account? <a href="/user/login" className="text-primary">Sign in</a></p>
    </form>
  );
}
