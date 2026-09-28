import { httpClient } from '@/lib/http/client';
import type { Video, VideoFormData } from '@/types/video';
import type { VideoCoachOptionsResponse } from '@/features/videos/types/video.types';

export const VIDEO_COACHES_URL = '/api/admin/coaches';

export async function getVideoCoachOptions(): Promise<VideoCoachOptionsResponse> {
  return httpClient.get<VideoCoachOptionsResponse>(VIDEO_COACHES_URL);
}

export async function createVideo(payload: VideoFormData & { coachId: string }): Promise<Video> {
  return httpClient.post<Video>('/api/videos', payload);
}

export async function importExerciseAsVideo(payload: Record<string, unknown> & { coachId: string }): Promise<Video> {
  return httpClient.post<Video>('/api/videos/import-exercise', payload);
}

export async function deleteVideo(videoId: string): Promise<{ message: string }> {
  return httpClient.delete<{ message: string }>(`/api/videos/${encodeURIComponent(videoId)}`);
}
