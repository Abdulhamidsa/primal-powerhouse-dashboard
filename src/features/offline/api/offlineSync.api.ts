import { httpClient } from '@/lib/http/client';

type MealSummary = {
  optionsByType?: Record<string, Array<{ meal?: { id?: string } }>>;
};

export type OfflineSyncResult = {
  mealIds: string[];
  warmedRoutes: string[];
};

function localDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${now.getDate()}`.padStart(2, '0')}`;
}

function weekStartDateKey(): string {
  const date = new Date();
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  return localDateKeyFrom(date);
}

function localDateKeyFrom(date: Date): string {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
}

function mealIdsFromSummary(summary: MealSummary | null): string[] {
  if (!summary?.optionsByType) return [];

  return Array.from(
    new Set(
      Object.values(summary.optionsByType)
        .flat()
        .map(option => option.meal?.id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
}

/** Fetches the small, read-only dataset the installed user app needs offline. */
export async function syncCoreUserOfflineData(): Promise<OfflineSyncResult> {
  const today = localDateKey();
  const weekStart = weekStartDateKey();

  const results = await Promise.allSettled([
    httpClient.get('/api/auth/me'),
    httpClient.get('/api/user/dashboard/summary'),
    httpClient.get<MealSummary>('/api/user/meals/summary'),
    httpClient.get('/api/user/meals/selection'),
    httpClient.get('/api/user/meals/options'),
    httpClient.get('/api/user/meals/shopping-list'),
    httpClient.get('/api/user/training/plan'),
    httpClient.get('/api/user/workout-assignments'),
    httpClient.get('/api/user/videos'),
    httpClient.get(`/api/user/daily-checkins/current?dayDate=${today}`),
    httpClient.get('/api/user/daily-checkins/insights'),
    httpClient.get(`/api/user/daily-nutrition/current?dayDate=${today}`),
    httpClient.get(`/api/user/daily-training/current?dayDate=${today}`),
    httpClient.get(`/api/user/weekly-checkins/current?weekStartDate=${weekStart}`),
    httpClient.get(`/api/user/adherence/current?dayDate=${today}`),
  ]);

  const summaryResult = results[2];
  const mealIds = summaryResult.status === 'fulfilled' ? mealIdsFromSummary(summaryResult.value) : [];

  await Promise.allSettled(mealIds.map(id => httpClient.get(`/api/meals/${encodeURIComponent(id)}?view=client`)));

  return {
    mealIds,
    warmedRoutes: [
      '/user/dashboard',
      '/user/my-plan',
      '/user/check-ins',
      '/user/training',
      '/user/shopping-list',
      '/user/profile',
      '/user/learn',
      ...mealIds.map(id => `/user/meals/${encodeURIComponent(id)}`),
    ],
  };
}
