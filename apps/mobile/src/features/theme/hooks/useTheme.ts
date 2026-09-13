import { useEffect, useSyncExternalStore } from 'react';
import { getTheme, subscribeTheme, selectTheme, restoreTheme } from '../api/theme.api';
import { themes } from '../types/theme.types';
export function useTheme() { const name = useSyncExternalStore(subscribeTheme, getTheme, getTheme); return { name, colors: themes[name], options: Object.keys(themes), select: selectTheme }; }
export function useRestoreTheme() { useEffect(() => { void restoreTheme().catch(() => {}); }, []); }
