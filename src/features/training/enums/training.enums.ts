import { z } from 'zod';

// Enums matching Prisma schema

export const muscleGroupEnum = z.enum([
  'CHEST',
  'BACK',
  'SHOULDERS',
  'BICEPS',
  'TRICEPS',
  'FOREARMS',
  'CORE',
  'ABS',
  'OBLIQUES',
  'GLUTES',
  'QUADRICEPS',
  'HAMSTRINGS',
  'CALVES',
  'ADDUCTORS',
  'ABDUCTORS',
  'LEGS',
] as const);

export type MuscleGroup = z.infer<typeof muscleGroupEnum>;

export const equipmentEnum = z.enum([
  'DUMBBELL',
  'BARBELL',
  'KETTLEBELL',
  'MACHINE',
  'CABLE',
  'BODYWEIGHT',
  'BAND',
  'TRX',
  'MEDICINE_BALL',
  'BOX',
  'EZ_BAR',
  'TRAP_BAR',
] as const);

export type Equipment = z.infer<typeof equipmentEnum>;

export const difficultyLevelEnum = z.enum([
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'EXPERT',
] as const);

export type DifficultyLevel = z.infer<typeof difficultyLevelEnum>;

export const sourceTypeEnum = z.enum([
  'MANUAL',
  'AI_GENERATED',
  'CLONED',
] as const);

export type SourceType = z.infer<typeof sourceTypeEnum>;

export const planStatusEnum = z.enum([
  'DRAFT',
  'ACTIVE',
  'COMPLETED',
  'ARCHIVED',
] as const);

export type PlanStatus = z.infer<typeof planStatusEnum>;

export const trainingDayTypeEnum = z.enum([
  'WORKOUT',
  'REST',
] as const);

export type TrainingDayType = z.infer<typeof trainingDayTypeEnum>;

export const planDayStatusEnum = z.enum([
  'PENDING',
  'COMPLETED',
  'SKIPPED',
  'MISSED',
] as const);

export type PlanDayStatus = z.infer<typeof planDayStatusEnum>;

export const sessionStatusEnum = z.enum([
  'IN_PROGRESS',
  'COMPLETED',
  'ABANDONED',
] as const);

export type SessionStatus = z.infer<typeof sessionStatusEnum>;

export const perceivedDifficultyEnum = z.enum([
  'EASY',
  'GOOD',
  'HARD',
  'VERY_HARD',
] as const);

export type PerceivedDifficulty = z.infer<typeof perceivedDifficultyEnum>;
