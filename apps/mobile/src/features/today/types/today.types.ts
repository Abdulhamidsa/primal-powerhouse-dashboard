import type { z } from 'zod';
import type { userDashboardSummarySchema } from '@primal/contracts/user-dashboard/schemas/userDashboard.schema';
export type DashboardSummary = z.infer<typeof userDashboardSummarySchema>;
