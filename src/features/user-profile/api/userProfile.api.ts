import { httpClient } from '@/lib/http/client';
import type { DisplayNameResponse, PasswordLinkResponse, RecoveryEmailResponse, UserProfileResponse } from '@/features/user-profile/types/userProfile.types';

export const USER_PROFILE_ME_URL = '/api/auth/me';
export const USER_PROFILE_LOGOUT_URL = '/api/auth/logout';
export const USER_PASSWORD_LINK_URL = '/api/auth/user/password-link';
export const USER_RECOVERY_EMAIL_URL = '/api/auth/user/recovery-email';
export const USER_PROFILE_UPDATE_URL = '/api/user/profile';

export async function getUserProfile(): Promise<UserProfileResponse> {
  return httpClient.get<UserProfileResponse>(USER_PROFILE_ME_URL);
}

export async function logoutUser(): Promise<void> {
  await httpClient.post(USER_PROFILE_LOGOUT_URL);
}

export async function sendUserPasswordLink(): Promise<PasswordLinkResponse> {
  return httpClient.post<PasswordLinkResponse>(USER_PASSWORD_LINK_URL);
}

export async function addRecoveryEmail(email: string): Promise<RecoveryEmailResponse> {
  return httpClient.post<RecoveryEmailResponse>(USER_RECOVERY_EMAIL_URL, { email });
}

export async function updateDisplayName(name: string): Promise<DisplayNameResponse> {
  return httpClient.patch<DisplayNameResponse>(USER_PROFILE_UPDATE_URL, { name });
}
