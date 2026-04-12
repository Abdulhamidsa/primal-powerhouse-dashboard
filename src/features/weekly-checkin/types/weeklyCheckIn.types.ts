import type { z } from 'zod';
import type { weeklyCheckInPayloadSchema } from '@/features/weekly-checkin/schemas/weeklyCheckIn.schema';

export type WeeklyCheckInStatus = 'due' | 'overdue' | 'completed';

export type WeeklyCheckInPayload = z.infer<typeof weeklyCheckInPayloadSchema>;

export type WeeklyCheckInRecord = {
  id: string;
  weekStartDate: string;
  submittedAt: string;
  weightKg: number | null;
  progressPhotoFrontUrl: string | null;
  progressPhotoSideUrl: string | null;
  progressPhotoBackUrl: string | null;
  strengthUpdate: string | null;
  blockerText: string | null;
  notes: string | null;
};

export type WeeklyCheckInCurrentResponse = {
  weekStartDate: string;
  checkIn: WeeklyCheckInRecord | null;
};

export type WeeklyCheckInUpsertResponse = {
  success: boolean;
  weekStartDate: string;
  checkIn: WeeklyCheckInRecord;
};

export type WeeklyCheckInFormValues = {
  includeWeight: boolean;
  weightKg: string;
  progressPhotoFrontUrl: string;
  progressPhotoSideUrl: string;
  progressPhotoBackUrl: string;
  strengthUpdate: string;
  blockerText: string;
  notes: string;
};
