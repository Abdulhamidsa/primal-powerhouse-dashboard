import { useEffect, useState, useSyncExternalStore } from 'react';
import { getAuthState, subscribeAuth, restoreSession, saveSession } from '../api/sessionStore';
import { login, logout } from '../api/auth.api';
import { mobileLoginSchema } from '../schemas/auth.schema';
export function useAuth() {
  return useSyncExternalStore(subscribeAuth, getAuthState, getAuthState);
}
export function useRestoreAuth() { useEffect(() => { void restoreSession(); }, []); }
export function useLogin() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false); const [error, setError] = useState('');
  return { email, setEmail, password, setPassword, pending, error, submit: async () => {
    if (pending) return;
    const input = mobileLoginSchema.safeParse({ email, password });
    if (!input.success) { setError(input.error.issues[0].message); return; }
    setPending(true); setError('');
    try { await saveSession(await login(input.data.email, input.data.password)); setPassword(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign in'); }
    finally { setPending(false); }
  } };
}
export function useLogout() {
  const [error, setError] = useState('');
  return { error, logout: async () => {
    const session = getAuthState().session;
    try { if (session) await logout(session.refreshToken); await saveSession(null); }
    catch { setError('Connect to the internet to securely sign out and revoke this session.'); }
  } };
}
