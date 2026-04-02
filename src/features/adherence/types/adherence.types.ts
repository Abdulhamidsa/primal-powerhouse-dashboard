import type { z } from 'zod';
import type {
  adherenceMealTypeSchema,
  dailyIntakeOverrideSchema,
  toggleMealCompletionSchema,
} from '@/features/adherence/schemas/adherence.schema';

export type AdherenceMealType = z.infer<typeof adherenceMealTypeSchema>;
export type ToggleMealCompletionPayload = z.infer<typeof toggleMealCompletionSchema>;
export type DailyIntakeOverridePayload = z.infer<typeof dailyIntakeOverrideSchema>;

export type MealCompletionEntry = {
  id: string;
  dayDate: string;
  mealType: AdherenceMealType;
  slotIndex: number;
  mealId: string;
  sourceAssignmentId: string | null;
  portion: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  completedAt: string;
};

export type DailyIntakeOverrideEntry = {
  id: string;
  dayDate: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  note: string | null;
  updatedAt: string;
};

export type AdherenceCurrentResponse = {
  dayDate: string;
  completion: {
    completedCount: number;
    totalSelectedCount: number;
    percentage: number;
  };
  completions: MealCompletionEntry[];
  autoTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  override: DailyIntakeOverrideEntry | null;
  effectiveTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  effectiveSource: 'auto' | 'override';
};

export type ToggleMealCompletionResponse = {
  success: boolean;
  dayDate: string;
  completion: AdherenceCurrentResponse['completion'];
};

export type DailyIntakeOverrideCurrentResponse = {
  dayDate: string;
  override: DailyIntakeOverrideEntry | null;
};

export type DailyIntakeOverrideUpsertResponse = {
  success: boolean;
  dayDate: string;
  override: DailyIntakeOverrideEntry;
};
