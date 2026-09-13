import { httpClient } from '@/lib/http/client';
import type { Session } from '../types/auth.types';
export const login = (email: string, password: string) => httpClient.send<Session>('/api/auth/mobile/login', 'POST', { email, password }, false);
export const logout = (refreshToken: string) => httpClient.send('/api/auth/mobile/logout', 'POST', { refreshToken }, false);
export const reauthenticate = (password: string) => httpClient.send('/api/auth/mobile/reauthenticate', 'POST', { password });
