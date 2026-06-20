import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { getCachedUserDashboardSummary } from '@/features/user-dashboard/lib/loadUserDashboardSummary';
import { userDashboardSummarySchema } from '@/features/user-dashboard/schemas/userDashboard.schema';

export async function GET(request: NextRequest) {
  const startedAt = performance.now();

  try {
    const { error, user } = requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = await getCachedUserDashboardSummary(user.userId);
    const parsed = userDashboardSummarySchema.safeParse(summary);

    if (!parsed.success) {
      console.error('[USER_DASHBOARD_SUMMARY_GET] Invalid response shape', parsed.error.flatten());
      return jsonWithCache({ error: 'Failed to build dashboard summary' }, { status: 500 });
    }

    const response = jsonWithCache(parsed.data);
    const duration = Math.round(performance.now() - startedAt);
    response.headers.set('Server-Timing', `dashboard-summary;dur=${duration}`);
    console.info('[USER_DASHBOARD_SUMMARY_GET]', { userId: user.userId, durationMs: duration });
    return response;
  } catch (error) {
    console.error('[USER_DASHBOARD_SUMMARY_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to load dashboard summary' }, { status: 500 });
  }
}
