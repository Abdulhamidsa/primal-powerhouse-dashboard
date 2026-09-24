import {
  adminCoachingInterestListResponseSchema,
  adminCoachingInterestSchema,
  coachingInterestResponseSchema,
} from '@/features/coaching-interest/schemas/coachingInterest.schema';
import type {
  AdminCoachingInterest,
  AdminCoachingInterestListResponse,
  AdminCoachingInterestStatus,
  CoachingInterestResponse,
} from '@/features/coaching-interest/types/coachingInterest.types';
import { httpClient } from '@/lib/http/client';

export const COACHING_INTEREST_URL = '/api/user/coaching-interest';

export async function getCoachingInterest(): Promise<CoachingInterestResponse> {
  return coachingInterestResponseSchema.parse(await httpClient.get<unknown>(COACHING_INTEREST_URL));
}

export async function requestCoachingInterest(): Promise<CoachingInterestResponse> {
  return coachingInterestResponseSchema.parse(await httpClient.post<unknown>(COACHING_INTEREST_URL, {}));
}

export const ADMIN_COACHING_INTEREST_URL = '/api/admin/coaching-interests';

export function buildAdminCoachingInterestUrl(status: AdminCoachingInterestStatus): string {
  return `${ADMIN_COACHING_INTEREST_URL}?status=${encodeURIComponent(status)}`;
}

export async function getAdminCoachingInterests(
  status: AdminCoachingInterestStatus,
): Promise<AdminCoachingInterestListResponse> {
  return adminCoachingInterestListResponseSchema.parse(
    await httpClient.get<unknown>(buildAdminCoachingInterestUrl(status)),
  );
}

export async function updateAdminCoachingInterest(
  messageId: string,
  contacted: boolean,
): Promise<AdminCoachingInterest> {
  return adminCoachingInterestSchema.parse(
    await httpClient.patch<unknown>(`${ADMIN_COACHING_INTEREST_URL}/${encodeURIComponent(messageId)}`, { contacted }),
  );
}
