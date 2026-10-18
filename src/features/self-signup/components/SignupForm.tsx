'use client';

import { useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRightIcon, CheckIcon, CopyIcon, EnvelopeSimpleIcon, EyeIcon, EyeSlashIcon, GoogleLogoIcon, InfoIcon, LockKeyIcon, MagicWandIcon, UserIcon } from '@phosphor-icons/react';
import { suggestUsernames } from '../api/auth.api';
import { useAgePolicy, useLegalRequirements, useSignupAction } from '../hooks/useAuthForms';
import { getPasswordStrength } from '../lib/passwordStrength';

type SignupMethod = 'email' | 'username';

const inputClassName = 'min-h-12 w-full rounded-lg border border-border bg-transparent px-4 py-3 pl-11 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-foreground focus:ring-2 focus:ring-foreground/10';

export function SignupForm() {
  const router = useRouter();
  const { run, loading, error, setError } = useSignupAction();
  const { data: agePolicy } = useAgePolicy();
  const { data: legalRequirements } = useLegalRequirements();
  const [method, setMethod] = useState<SignupMethod>('email');
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [ageDeclared, setAgeDeclared] = useState(false);
  const [legalAcknowledged, setLegalAcknowledged] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [copyLabel, setCopyLabel] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordStrength = getPasswordStrength(form.password);
  const googleReady = agePolicy !== undefined && legalRequirements !== undefined
    && (agePolicy.enabled !== true || ageDeclared)
    && (legalRequirements.signupAcceptanceRequired !== true || legalAcknowledged);
  const googleHref = `/api/auth/google/start?${new URLSearchParams({ ...(ageDeclared ? { ageDeclared: 'true' } : {}), ...(legalAcknowledged ? { legalAcknowledged: 'true' } : {}) }).toString()}`;

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
      ? await run({ method: 'email', email: form.email, password: form.password, ageDeclared, legalAcknowledged })
      : await run({ method: 'username', username: form.username, password: form.password, ageDeclared, legalAcknowledged });
    if (method === 'email') router.replace(`/user/verify-required?email=${encodeURIComponent(result.email ?? form.email)}`);
    else router.replace('/user/dashboard');
  }

  function handleGoogleStart(event: MouseEvent<HTMLAnchorElement>) {
    if (googleReady) return;
    event.preventDefault();
    setError('Please complete the required signup confirmations before continuing with Google.');
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="flex border-b border-border" role="tablist" aria-label="Account identifier">
        <button type="button" role="tab" aria-selected={method === 'email'} onClick={() => setMethod('email')} className={`min-h-11 flex-1 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${method === 'email' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Email</button>
        <button type="button" role="tab" aria-selected={method === 'username'} onClick={() => setMethod('username')} className={`min-h-11 flex-1 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${method === 'username' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Username</button>
      </div>
      {method === 'email' ? (
        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-sm font-medium text-foreground">Email address</label>
          <div className="relative"><EnvelopeSimpleIcon size={19} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><input id="signup-email" name="email" className={inputClassName} placeholder="you@example.com" type="email" autoComplete="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} required /></div>
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor="signup-username" className="text-sm font-medium text-foreground">Username</label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1"><UserIcon size={19} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><input id="signup-username" name="username" className={inputClassName} placeholder="Choose a username" autoComplete="username" value={form.username} onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))} required /></div>
            <button type="button" onClick={makeUsername} disabled={suggesting} className="inline-flex min-h-12 min-w-[88px] shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-foreground transition hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"><MagicWandIcon size={16} aria-hidden="true" />{suggesting ? 'Making…' : 'Suggest'}</button>
          </div>
          {form.username ? <button type="button" onClick={copyUsername} className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:underline">{copyLabel ? <CheckIcon size={14} aria-hidden="true" /> : <CopyIcon size={14} aria-hidden="true" />}{copyLabel || 'Copy username'}</button> : null}
        </div>
      )}
      <div className="space-y-1.5">
        <label htmlFor="signup-password" className="text-sm font-medium text-foreground">Password</label>
        <div className="relative">
          <LockKeyIcon size={19} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            id="signup-password"
            name="password"
            className={`${inputClassName} pr-20`}
            placeholder="At least 8 characters"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
            aria-describedby="password-hint"
            required
          />
          <span
            title="Use at least 8 characters. Longer passwords with varied characters are stronger."
            className="absolute right-11 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <InfoIcon size={16} aria-hidden="true" focusable="false" />
            <span className="sr-only">Password guidance: use at least 8 characters. Longer passwords with varied characters are stronger.</span>
          </span>
          <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted/60 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20" aria-label={showPassword ? 'Hide password' : 'Show password'}>
            {showPassword ? <EyeSlashIcon size={19} aria-hidden="true" /> : <EyeIcon size={19} aria-hidden="true" />}
          </button>
        </div>
        <div className="flex min-h-1 items-center gap-2" aria-live="polite">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            {passwordStrength ? (
              <div
                className={`h-full rounded-full transition-[width,background-color] ${
                  passwordStrength === 'Weak'
                  ? 'w-1/3 bg-foreground'
                    : passwordStrength === 'Good'
                      ? 'w-2/3 bg-foreground'
                      : 'w-full bg-foreground'
                }`}
              />
            ) : null}
          </div>
          {passwordStrength ? (
            <span
                className="text-[11px] font-medium leading-none text-muted-foreground"
            >
              {passwordStrength}
            </span>
          ) : null}
        </div>
        <span id="password-hint" className="sr-only">
          Use at least 8 characters. Longer passwords with varied characters are stronger.
        </span>
      </div>
      <div className="space-y-3">
        {agePolicy?.enabled ? (
          <label className="flex min-h-12 items-start gap-3 rounded-xl border border-border bg-muted/20 px-3.5 py-3 text-sm leading-5 text-muted-foreground">
            <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-foreground accent-foreground focus:ring-foreground" checked={ageDeclared} onChange={event => setAgeDeclared(event.target.checked)} required />
            <span className="min-w-0 flex-1">I confirm that I meet the minimum age requirement of {agePolicy.minimumAge}.</span>
          </label>
        ) : null}
        {legalRequirements?.signupAcceptanceRequired ? (
          <label className="flex min-h-12 items-start gap-3 rounded-xl border border-border bg-muted/20 px-3.5 py-3 text-sm leading-5 text-muted-foreground">
            <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-foreground accent-foreground focus:ring-foreground" checked={legalAcknowledged} onChange={event => setLegalAcknowledged(event.target.checked)} required />
            <span className="min-w-0 flex-1">I agree to the <Link href="/legal/terms" className="text-foreground underline-offset-4 hover:underline">Terms</Link> and <Link href="/legal/privacy" className="text-foreground underline-offset-4 hover:underline">Privacy Policy</Link>.</span>
          </label>
        ) : <p className="text-center text-xs leading-5 text-muted-foreground">By creating an account, you agree to our <Link href="/legal/terms" className="text-foreground underline-offset-4 hover:underline">Terms</Link> and <Link href="/legal/privacy" className="text-foreground underline-offset-4 hover:underline">Privacy Policy</Link>.</p>}
      </div>
      {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      <button disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-3 font-semibold text-background transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Creating account…' : method === 'username' ? 'Create account' : 'Create free account'}{!loading && <ArrowRightIcon size={19} aria-hidden="true" />}</button>
      <a href={googleHref} onClick={handleGoogleStart} aria-disabled={!googleReady} className={`flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-transparent px-4 py-3 text-center font-semibold text-foreground transition hover:border-border-strong hover:bg-muted/30 ${googleReady ? '' : 'cursor-not-allowed opacity-60'}`}><GoogleLogoIcon size={19} weight="bold" aria-hidden="true" />Continue with Google</a>
      <p className="text-center text-sm text-muted-foreground">Already have an account? <a href="/user/login" className="font-semibold text-foreground underline-offset-4 hover:underline">Sign in</a></p>
    </form>
  );
}
