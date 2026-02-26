import { z } from 'zod';

export const complianceRiskStatusSchema = z.enum(['on_track', 'needs_attention', 'at_risk', 'no_data']);
export const complianceTrendSchema = z.enum(['up', 'down', 'neutral', 'no_data']);

export const weeklyComplianceBreakdownSchema = z.object({
  weekStartDate: z.string(),
  trainingCompliance: z.number().nullable(),
  nutritionCompliance: z.number().nullable(),
  checkInCompliance: z.number().nullable(),
  overallCompliance: z.number().nullable(),
  riskStatus: complianceRiskStatusSchema,
  trend: complianceTrendSchema,
  trendDelta: z.number().nullable(),
  lastCheckInDate: z.string().nullable(),
  completedVideos: z.number(),
  assignedVideos: z.number(),
  dataSources: z.object({
    training: z.enum(['daily_logs', 'video_assignments', 'weekly_checkin', 'none']),
    nutrition: z.enum(['daily_logs', 'weekly_checkin', 'none']),
    checkIn: z.enum(['weekly_checkin', 'none']),
  }),
});

export const clientHealthResponseSchema = z.object({
  client: z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
  }),
  summary: z.object({
    totalActiveClients: z.number(),
    clientsAtRisk: z.number(),
    clientsStable: z.number(),
    clientsOnTrack: z.number(),
    averageCompliance: z.number().nullable(),
  }),
  currentWeek: weeklyComplianceBreakdownSchema,
  history: z.array(weeklyComplianceBreakdownSchema),
});
