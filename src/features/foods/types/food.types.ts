import type { z } from 'zod';
import type {
  createFoodSchema,
  foodBaseUnitSchema,
  foodCategorySchema,
  foodSourceSchema,
  foodStateSchema,
  updateFoodSchema,
} from '@/features/foods/schemas/food.schema';

export type FoodCategory = z.infer<typeof foodCategorySchema>;
export type FoodState = z.infer<typeof foodStateSchema>;
export type FoodSource = z.infer<typeof foodSourceSchema>;
export type FoodBaseUnit = z.infer<typeof foodBaseUnitSchema>;

export type CreateFoodPayload = z.infer<typeof createFoodSchema>;
export type UpdateFoodPayload = z.infer<typeof updateFoodSchema>;

export type FoodRecord = {
  id: string;
  name: string;
  category: FoodCategory;
  state: FoodState;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  source: FoodSource;
  isActive: boolean;
  sourceRef: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  baseUnit: FoodBaseUnit;
  gramsPerUnit: number | null;
  displayUnitLabel: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FoodsListResponse = {
  items: FoodRecord[];
  total: number;
};

export type FoodsSearchParams = {
  q?: string;
  category?: FoodCategory;
  state?: FoodState;
  isActive?: boolean;
  limit?: number;
};
