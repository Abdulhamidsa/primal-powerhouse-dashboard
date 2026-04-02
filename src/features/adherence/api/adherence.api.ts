import { httpClient } from '@/lib/http/client';
import type {
  AdherenceCurrentResponse,
  DailyIntakeOverrideCurrentResponse,
  DailyIntakeOverridePayload,
  DailyIntakeOverrideUpsertResponse,
  ToggleMealCompletionPayload,
  ToggleMealCompletionResponse,
} from '@/features/adherence/types/adherence.types';

export const USER_ADHERENCE_CURRENT_URL = '/api/user/adherence/current';
export const USER_MEAL_COMPLETIONS_URL = '/api/user/meals/completions';
export const USER_DAILY_INTAKE_URL = '/api/user/daily-intake/current';

export function buildAdherenceCurrentUrl(dayDate: string): string {
  const searchParams = new URLSearchParams({ dayDate });
  return `${USER_ADHERENCE_CURRENT_URL}?${searchParams.toString()}`;
}

export async function getAdherenceCurrent(dayDate: string): Promise<AdherenceCurrentResponse> {
  return httpClient.get<AdherenceCurrentResponse>(buildAdherenceCurrentUrl(dayDate));
}

export async function createMealCompletion(
  payload: ToggleMealCompletionPayload,
): Promise<ToggleMealCompletionResponse> {
  return httpClient.post<ToggleMealCompletionResponse>(USER_MEAL_COMPLETIONS_URL, payload);
}

export async function deleteMealCompletion(
  payload: ToggleMealCompletionPayload,
): Promise<ToggleMealCompletionResponse> {
  return httpClient.delete<ToggleMealCompletionResponse>(USER_MEAL_COMPLETIONS_URL, {
    body: JSON.stringify(payload),
  });
}

export function buildDailyIntakeCurrentUrl(dayDate: string): string {
  const searchParams = new URLSearchParams({ dayDate });
  return `${USER_DAILY_INTAKE_URL}?${searchParams.toString()}`;
}

export async function getDailyIntakeCurrent(dayDate: string): Promise<DailyIntakeOverrideCurrentResponse> {
  return httpClient.get<DailyIntakeOverrideCurrentResponse>(buildDailyIntakeCurrentUrl(dayDate));
}

export async function upsertDailyIntakeCurrent(
  payload: DailyIntakeOverridePayload,
): Promise<DailyIntakeOverrideUpsertResponse> {
  return httpClient.put<DailyIntakeOverrideUpsertResponse>(USER_DAILY_INTAKE_URL, payload);
}
