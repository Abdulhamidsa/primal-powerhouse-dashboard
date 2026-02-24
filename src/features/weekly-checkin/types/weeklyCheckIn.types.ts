import type { z } from 'zod';
import type { weeklyCheckInPayloadSchema } from '@/features/weekly-checkin/schemas/weeklyCheckIn.schema';

export type WeeklyCheckInStatus = 'due' | 'overdue' | 'completed';

export type WeeklyCheckInPayload = z.infer<typeof weeklyCheckInPayloadSchema>;

export type WeeklyCheckInRecord = {
  id: string;
  weekStartDate: string;
  submittedAt: string;
  weightKg: number | null;
  waistCm: number | null;
  trainingAdherence: number;
  nutritionAdherence: number;
  energyRating: number;
  stressRating: number | null;
  hungerRating: number | null;
  digestionRating: number | null;
  sleepHours: number | null;
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
  waistCm: string;
  trainingAdherence: string;
  nutritionAdherence: string;
  energyRating: number | null;
  stressRating: number | null;
  hungerRating: number | null;
  digestionRating: number | null;
  sleepHours: string;
  strengthUpdate: string;
  blockerText: string;
  notes: string;
};
