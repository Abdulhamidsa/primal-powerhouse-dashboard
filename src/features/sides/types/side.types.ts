import type { z } from 'zod';
import {
  createSideSchema,
  generateSideSchema,
  generatedSideTemplateSchema,
  sideEntitySchema,
  sideFoodOriginSchema,
  sideTypeSchema,
} from '@/features/sides/schemas/side.schema';

export type SideType = z.infer<typeof sideTypeSchema>;
export type SideFoodOrigin = z.infer<typeof sideFoodOriginSchema>;
export type SideItem = z.infer<typeof sideEntitySchema>;
export type CreateSideInput = z.infer<typeof createSideSchema>;
export type GenerateSideInput = z.infer<typeof generateSideSchema>;
export type GeneratedSideTemplate = z.infer<typeof generatedSideTemplateSchema>;

export const SIDE_TYPE_OPTIONS: Array<{ value: SideType; label: string }> = [
  { value: 'SALAD', label: 'Salad' },
  { value: 'SOUP', label: 'Soup' },
];

export const SIDE_FOOD_ORIGIN_OPTIONS: Array<{ value: 'ANY' | SideFoodOrigin; label: string }> = [
  { value: 'ANY', label: 'Any origin' },
  { value: 'Middle Eastern', label: 'Middle Eastern' },
  { value: 'Western', label: 'Western' },
  { value: 'Greek', label: 'Greek' },
  { value: 'Mediterranean', label: 'Mediterranean' },
  { value: 'Mexican', label: 'Mexican' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Asian', label: 'Asian' },
  { value: 'Indian', label: 'Indian' },
];
