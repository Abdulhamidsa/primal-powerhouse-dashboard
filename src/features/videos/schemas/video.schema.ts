import { z } from 'zod';

const videoCategories = [
  'STRENGTH_TRAINING',
  'CARDIO',
  'MOBILITY',
  'FUNCTIONAL',
  'YOGA',
  'PILATES',
  'WARM_UP',
  'COOL_DOWN',
  'REHABILITATION',
  'SPORTS_SPECIFIC',
] as const;

const difficultyLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;

const stringArray = z.array(z.string().trim().max(500)).max(100);

const optionalUrl = z.union([z.string().url().max(2048), z.literal(''), z.null()]).optional();

export const videoListQuerySchema = z.object({
  category: z.enum(videoCategories).optional(),
  difficulty: z.enum(difficultyLevels).optional(),
}).strict();

export const videoWriteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5_000).nullable().optional(),
  category: z.enum(videoCategories),
  difficulty: z.enum(difficultyLevels),
  duration: z.number().int().min(1).max(86_400),
  videoUrl: z.string().url().max(2_048),
  thumbnailUrl: optionalUrl,
  equipment: stringArray.optional(),
  muscleGroups: stringArray.optional(),
  tags: stringArray.optional(),
  instructions: stringArray.optional(),
  tips: stringArray.optional(),
  isPublic: z.boolean().optional(),
  coachId: z.string().trim().min(1).max(100).optional(),
}).strict();

export const videoUpdateSchema = videoWriteSchema.partial();

export const exerciseImportSchema = z.object({
  exerciseId: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(200),
  gifUrl: z.string().url().max(2_048),
  targetMuscles: stringArray.optional(),
  bodyParts: stringArray.optional(),
  equipments: stringArray.optional(),
  secondaryMuscles: stringArray.optional(),
  instructions: stringArray.optional(),
  coachId: z.string().trim().min(1).max(100).optional(),
}).strict();

export type VideoWriteInput = z.infer<typeof videoWriteSchema>;
export type VideoUpdateInput = z.infer<typeof videoUpdateSchema>;
export type ExerciseImportInput = z.infer<typeof exerciseImportSchema>;
