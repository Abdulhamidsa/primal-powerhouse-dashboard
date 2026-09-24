import { z } from 'zod';
import {
  adminCoachingInterestListResponseSchema,
  adminCoachingInterestSchema,
  adminCoachingInterestStatusSchema,
  coachingInterestResponseSchema,
  updateAdminCoachingInterestSchema,
} from '@/features/coaching-interest/schemas/coachingInterest.schema';

export type CoachingInterestResponse = z.infer<typeof coachingInterestResponseSchema>;
export type AdminCoachingInterest = z.infer<typeof adminCoachingInterestSchema>;
export type AdminCoachingInterestListResponse = z.infer<typeof adminCoachingInterestListResponseSchema>;
export type AdminCoachingInterestStatus = z.infer<typeof adminCoachingInterestStatusSchema>;
export type UpdateAdminCoachingInterest = z.infer<typeof updateAdminCoachingInterestSchema>;
