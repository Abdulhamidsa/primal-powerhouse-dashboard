import { httpClient } from '@/lib/http/client';
import type {
  WeeklyCheckInCurrentResponse,
  WeeklyCheckInPayload,
  WeeklyCheckInUpsertResponse,
} from '@/features/weekly-checkin/types/weeklyCheckIn.types';

export function buildWeeklyCheckInCurrentUrl(weekStartDate: string): string {
  const searchParams = new URLSearchParams({ weekStartDate });
  return `/api/user/weekly-checkins/current?${searchParams.toString()}`;
}

export async function getWeeklyCheckInCurrent(weekStartDate: string): Promise<WeeklyCheckInCurrentResponse> {
  return httpClient.get<WeeklyCheckInCurrentResponse>(buildWeeklyCheckInCurrentUrl(weekStartDate));
}

export async function upsertWeeklyCheckIn(
  weekStartDate: string,
  payload: WeeklyCheckInPayload,
): Promise<WeeklyCheckInUpsertResponse> {
  return httpClient.put<WeeklyCheckInUpsertResponse>('/api/user/weekly-checkins/current', {
    weekStartDate,
    payload,
  });
}

type CloudinaryUploadResponse = {
  success: true;
  data: {
    url: string;
  };
};

export async function uploadWeeklyCheckInPhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'weekly-checkins');
  formData.append('tags', 'weekly-checkin,progress-photo');

  const response = await httpClient.postForm<CloudinaryUploadResponse>('/api/cloudinary/upload', formData);
  return response.data.url;
}
