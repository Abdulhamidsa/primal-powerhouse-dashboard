import { z } from 'zod';
import {
  clientProfileEditFormSchema,
  clientProfileEditSchema,
} from '@/features/client-profile-edit/schemas/clientProfileEdit.schema';

export type ClientProfileEditPayload = z.infer<typeof clientProfileEditSchema>;
export type ClientProfileEditFormValues = z.infer<typeof clientProfileEditFormSchema>;

export type ClientProfileEditResponse = {
  id: string;
  name: string;
  email: string;
  age: number | null;
  gender: 'MALE' | 'FEMALE' | null;
  activityLevel: 'LOW' | 'MODERATE' | 'HIGH' | null;
  height: number | null;
  currentWeight: number | null;
  targetWeight: number | null;
};

export type ClientProfileEditFieldErrors = Partial<Record<keyof ClientProfileEditFormValues, string>>;
