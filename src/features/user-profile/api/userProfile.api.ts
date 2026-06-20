import { httpClient } from '@/lib/http/client';
import type { UserProfileResponse } from '@/features/user-profile/types/userProfile.types';

export const USER_PROFILE_ME_URL = '/api/auth/me';
export const USER_PROFILE_LOGOUT_URL = '/api/auth/logout';

export async function getUserProfile(): Promise<UserProfileResponse> {
  return httpClient.get<UserProfileResponse>(USER_PROFILE_ME_URL);
}

export async function logoutUser(): Promise<void> {
  await httpClient.post(USER_PROFILE_LOGOUT_URL);
}

