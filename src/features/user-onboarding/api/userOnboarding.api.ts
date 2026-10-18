import { httpClient } from '@/lib/http/client';
import type { UserOnboardingCompletionResponse } from '@/features/user-onboarding/types/userOnboarding.types';

export const USER_ONBOARDING_COMPLETE_URL = '/api/user/onboarding/complete';

export async function completeUserOnboarding(): Promise<UserOnboardingCompletionResponse> {
  return httpClient.post<UserOnboardingCompletionResponse>(USER_ONBOARDING_COMPLETE_URL);
}
