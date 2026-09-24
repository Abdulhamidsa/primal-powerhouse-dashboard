import { coachingInterestResponseSchema } from '@/features/coaching-interest/schemas/coachingInterest.schema';
import type { CoachingInterestResponse } from '@/features/coaching-interest/types/coachingInterest.types';
import { httpClient } from '@/lib/http/client';

export const COACHING_INTEREST_URL = '/api/user/coaching-interest';

export async function getCoachingInterest(): Promise<CoachingInterestResponse> {
  return coachingInterestResponseSchema.parse(await httpClient.get<unknown>(COACHING_INTEREST_URL));
}

export async function requestCoachingInterest(): Promise<CoachingInterestResponse> {
  return coachingInterestResponseSchema.parse(await httpClient.post<unknown>(COACHING_INTEREST_URL, {}));
}
