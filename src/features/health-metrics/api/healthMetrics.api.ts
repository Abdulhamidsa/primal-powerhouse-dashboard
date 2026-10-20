import { httpClient } from '@/lib/http/client';
import { healthMetricsRequestSchema } from '@/features/health-metrics/schemas/healthMetrics.schema';
import type {
  HealthMetricsCalculateResponse,
  HealthMetricsRequestPayload,
  HealthMetricsSaveNotesResponse,
} from '@/features/health-metrics/types/healthMetrics.types';
import type { LatestHealthMetric } from '@/features/health-metrics/types/latestHealthMetric.types';

export function buildClientHealthMetricsUrl(clientId: string): string {
  return `/api/clients/${clientId}/health-metrics`;
}

export function buildClientHealthMetricsNotesUrl(clientId: string): string {
  return `/api/clients/${clientId}/health-metrics/notes`;
}

export function getLatestClientHealthMetrics(clientId: string): Promise<LatestHealthMetric[]> {
  return httpClient.get<LatestHealthMetric[]>(`${buildClientHealthMetricsUrl(clientId)}?limit=1`);
}

export async function calculateClientHealthMetrics(
  clientId: string,
  payload: HealthMetricsRequestPayload
): Promise<HealthMetricsCalculateResponse> {
  const parsed = healthMetricsRequestSchema.parse(payload);
  return httpClient.post<HealthMetricsCalculateResponse>(buildClientHealthMetricsUrl(clientId), parsed);
}

export async function saveClientHealthMetricsNotes(
  clientId: string,
  notes: string[]
): Promise<HealthMetricsSaveNotesResponse> {
  return httpClient.post<HealthMetricsSaveNotesResponse>(buildClientHealthMetricsNotesUrl(clientId), { notes });
}
