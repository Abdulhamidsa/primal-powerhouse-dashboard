import { httpClient } from '@/lib/http/client';
import type { Profile } from '../types/profile.types';
export const getProfile = () => httpClient.get<Profile>('/api/auth/me');
export const saveAvatar = (payload: unknown) => httpClient.send('/api/user/profile/avatar', 'PUT', payload);
export const sendFeedback = (payload: unknown) => httpClient.send('/api/user/feedback', 'POST', payload);
