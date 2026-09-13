import { z } from 'zod';
import { trainingDayTypeEnum, planDayStatusEnum } from '../enums/training.enums';

export const createTrainingPlanDaySchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  date: z.coerce.date(),
  weekday: z.number().int().min(0).max(6).nullable().optional(),
  type: trainingDayTypeEnum.default('WORKOUT'),
  workoutTemplateId: z.string().nullable().optional(),
  title: z.string().max(255).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
});

export const updateTrainingPlanDaySchema = z.object({
  weekday: z.number().int().min(0).max(6).nullable().optional(),
  type: trainingDayTypeEnum.optional(),
  workoutTemplateId: z.string().nullable().optional(),
  title: z.string().max(255).nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
  status: planDayStatusEnum.optional(),
});

export const bulkCreateTrainingPlanDaysSchema = z.object({
  planId: z.string().min(1),
  days: z
    .array(
      z.object({
        date: z.coerce.date().optional(),
        weekday: z.number().int().min(0).max(6).optional(),
        type: trainingDayTypeEnum,
        workoutTemplateId: z.string().nullable().optional(),
        title: z.string().max(255).nullable().optional(),
        note: z.string().max(1000).nullable().optional(),
      }),
    )
    .min(1),
});

export const weeklyTrainingPatternSchema = z.object({
  planId: z.string().min(1),
  days: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        type: trainingDayTypeEnum,
        workoutTemplateId: z.string().nullable().optional(),
        title: z.string().max(255).nullable().optional(),
        note: z.string().max(1000).nullable().optional(),
      }),
    )
    .length(7),
});

export type CreateTrainingPlanDayInput = z.infer<typeof createTrainingPlanDaySchema>;
export type UpdateTrainingPlanDayInput = z.infer<typeof updateTrainingPlanDaySchema>;
export type BulkCreateTrainingPlanDaysInput = z.infer<typeof bulkCreateTrainingPlanDaysSchema>;
export type WeeklyTrainingPatternInput = z.infer<typeof weeklyTrainingPatternSchema>;
