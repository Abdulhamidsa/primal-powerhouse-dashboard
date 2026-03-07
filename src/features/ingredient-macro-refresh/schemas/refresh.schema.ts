import { z } from 'zod';

export const ingredientMacroRefreshScopeSchema = z.enum(['all', 'templates_only']);

export const ingredientMacroRefreshRequestSchema = z.object({
  foodId: z.string().trim().min(1),
  scope: ingredientMacroRefreshScopeSchema.default('all'),
  confirm: z.boolean().default(false),
});
