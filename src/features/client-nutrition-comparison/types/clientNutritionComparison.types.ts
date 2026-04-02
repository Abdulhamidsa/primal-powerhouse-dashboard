import { z } from 'zod';
import {
  clientNutritionComparisonResponseSchema,
  comparisonSourceSchema,
  dailyNutritionComparisonSchema,
  intakeSourceSchema,
  macroTargetSchema,
  mealCompletionTimelineEntrySchema,
  nutritionStatusSchema,
  nutritionComparisonSummarySchema,
} from '@/features/client-nutrition-comparison/schemas/clientNutritionComparison.schema';

export type NutritionStatus = z.infer<typeof nutritionStatusSchema>;
export type ComparisonSource = z.infer<typeof comparisonSourceSchema>;
export type IntakeSource = z.infer<typeof intakeSourceSchema>;
export type MacroTarget = z.infer<typeof macroTargetSchema>;
export type MealCompletionTimelineEntry = z.infer<typeof mealCompletionTimelineEntrySchema>;
export type DailyNutritionComparison = z.infer<typeof dailyNutritionComparisonSchema>;
export type NutritionComparisonSummary = z.infer<typeof nutritionComparisonSummarySchema>;
export type ClientNutritionComparisonResponse = z.infer<typeof clientNutritionComparisonResponseSchema>;
