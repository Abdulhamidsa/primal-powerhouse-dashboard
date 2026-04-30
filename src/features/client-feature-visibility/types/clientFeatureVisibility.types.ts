import { z } from 'zod';
import {
  clientFeatureVisibilitySchema,
  clientFeatureVisibilityFormSchema,
} from '../schemas/clientFeatureVisibility.schema';

export type ClientFeatureVisibilityData = z.infer<typeof clientFeatureVisibilitySchema>;
export type ClientFeatureVisibilityFormValues = z.infer<typeof clientFeatureVisibilityFormSchema>;

export type ClientFeatureVisibilityResponse = {
  id: string;
  clientId: string;
  dailyCheckinsEnabled: boolean;
  dailyWeightEnabled: boolean;
  weeklyCheckinsEnabled: boolean;
  weightChartEnabled: boolean;
  progressPhotosEnabled: boolean;
  nutritionTrackingEnabled: boolean;
  workoutTrackingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};
