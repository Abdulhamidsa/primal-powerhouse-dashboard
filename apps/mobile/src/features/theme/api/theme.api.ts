import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, type ThemeName } from '../types/theme.types';
let current: ThemeName = 'ember';
const listeners = new Set<() => void>();
export const getTheme = () => current;
export const subscribeTheme = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export async function selectTheme(name: string) {
  if (!(name in themes)) return;
  current = name as ThemeName;
  listeners.forEach(fn => fn());
  await AsyncStorage.setItem('primal:theme', name);
}
export async function restoreTheme() { const saved = await AsyncStorage.getItem('primal:theme'); if (saved && saved in themes) await selectTheme(saved); }
