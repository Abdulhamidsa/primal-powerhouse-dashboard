import { z } from 'zod';
import { coachingInterestResponseSchema } from '@/features/coaching-interest/schemas/coachingInterest.schema';

export type CoachingInterestResponse = z.infer<typeof coachingInterestResponseSchema>;
