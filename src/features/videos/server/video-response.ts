import type { Prisma } from '@prisma/client';

export const videoResponseSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  difficulty: true,
  duration: true,
  videoUrl: true,
  thumbnailUrl: true,
  equipment: true,
  muscleGroups: true,
  tags: true,
  instructions: true,
  tips: true,
  isPublic: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
  coachId: true,
} satisfies Prisma.VideoSelect;

export type VideoResponseRecord = Prisma.VideoGetPayload<{ select: typeof videoResponseSelect }>;

function parseStringArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every(item => typeof item === 'string') ? parsed : [];
  } catch {
    return [];
  }
}

export function toVideoResponse(video: VideoResponseRecord) {
  return {
    ...video,
    equipment: parseStringArray(video.equipment),
    muscleGroups: parseStringArray(video.muscleGroups),
    tags: parseStringArray(video.tags),
    instructions: parseStringArray(video.instructions),
    tips: parseStringArray(video.tips),
  };
}
