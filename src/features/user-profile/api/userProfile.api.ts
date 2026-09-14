import { httpClient } from '@/lib/http/client';
import type { PasswordLinkResponse, UserProfileResponse } from '@/features/user-profile/types/userProfile.types';

export const USER_PROFILE_ME_URL = '/api/auth/me';
export const USER_PROFILE_LOGOUT_URL = '/api/auth/logout';
export const USER_PASSWORD_LINK_URL = '/api/auth/user/password-link';

export async function getUserProfile(): Promise<UserProfileResponse> {
  return httpClient.get<UserProfileResponse>(USER_PROFILE_ME_URL);
}

export async function logoutUser(): Promise<void> {
  await httpClient.post(USER_PROFILE_LOGOUT_URL);
}

export async function sendUserPasswordLink(): Promise<PasswordLinkResponse> {
  return httpClient.post<PasswordLinkResponse>(USER_PASSWORD_LINK_URL);
}
