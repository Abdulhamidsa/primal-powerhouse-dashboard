import { httpClient } from '@/lib/http/client';
import { userDashboardSummarySchema } from '@primal/contracts/user-dashboard/schemas/userDashboard.schema';
export const summaryPath = '/api/user/dashboard/summary';
export async function getSummary() { return userDashboardSummarySchema.parse(await httpClient.get(summaryPath)); }
