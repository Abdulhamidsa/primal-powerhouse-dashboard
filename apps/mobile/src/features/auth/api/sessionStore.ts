import { sessionStorage } from './sessionStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, AuthState } from '../types/auth.types';

const key = 'primal.session.v1';
let state: AuthState = { session: null, ready: false };
let generation = 0;
let writes: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>();
export const getAuthState = () => state;
export const getSessionGeneration = () => generation;
export const subscribeAuth = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export async function saveSession(session: Session | null, expectedRefreshToken?: string) {
  if (expectedRefreshToken && state.session?.refreshToken !== expectedRefreshToken) return;
  const revision = expectedRefreshToken && session ? generation : ++generation;
  const write = writes
    .catch(() => {})
    .then(async () => {
      if (revision !== generation || (expectedRefreshToken && state.session?.refreshToken !== expectedRefreshToken))
        return;
      const previous = state.session?.user.id;
      if (session) await sessionStorage.write(key, JSON.stringify(session));
      else await sessionStorage.remove(key);
      if (previous && previous !== session?.user.id) {
        const keys = (await AsyncStorage.getAllKeys()).filter(k => k.startsWith(`primal:${previous}:`));
        if (keys.length) await AsyncStorage.multiRemove(keys);
      }
      if (revision !== generation) return;
      state = { session, ready: true };
      listeners.forEach(listener => listener());
    });
  writes = write;
  return write;
}
export async function restoreSession() {
  const revision = generation;
  try {
    const raw = await sessionStorage.read(key);
    if (revision !== generation) return;
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && (!parsed.user?.id || !parsed.refreshToken || !parsed.accessToken)) throw new Error('Invalid session');
    state = { session: parsed, ready: true };
  } catch {
    if (revision !== generation) return;
    state = { session: null, ready: true };
  }
  listeners.forEach(listener => listener());
}
