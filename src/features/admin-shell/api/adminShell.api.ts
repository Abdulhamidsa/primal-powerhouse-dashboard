import { httpClient } from '@/lib/http/client';

export const ADMIN_LOGOUT_URL = '/api/auth/logout';

export async function logoutAdmin(): Promise<void> {
  await httpClient.post(ADMIN_LOGOUT_URL, {});
}
