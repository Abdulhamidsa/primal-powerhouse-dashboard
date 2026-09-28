 
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

const foodCategorySchema = z.enum(['protein', 'carb', 'fat', 'dairy', 'fruit', 'vegetable', 'extra']);
const foodStateSchema = z.enum(['raw', 'dry', 'as_sold', 'cooked']);
const foodSourceSchema = z.enum(['system', 'custom']);
const foodBaseUnitSchema = z.enum(['100g', 'unit']);

const nutritionNumberSchema = z.number().min(0).max(9999);

const inputIngredientSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    name: z.string().trim().min(2).max(120),
    category: foodCategorySchema,
    state: foodStateSchema,
    caloriesKcal: nutritionNumberSchema,
    proteinG: nutritionNumberSchema,
    carbsG: nutritionNumberSchema,
    fatG: nutritionNumberSchema,
    fiberG: nutritionNumberSchema.nullable().optional(),
    source: foodSourceSchema.default('system'),
    isActive: z.boolean().default(true),
    sourceRef: z.string().trim().min(1).max(200).nullable().optional(),
    verifiedAt: z.string().datetime().nullable().optional(),
    verifiedBy: z.string().trim().min(1).max(120).nullable().optional(),
    baseUnit: foodBaseUnitSchema,
    gramsPerUnit: z.number().positive().max(5000).nullable().optional(),
    displayUnitLabel: z.string().trim().min(1).max(40).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.baseUnit === 'unit') {
      if (!value.gramsPerUnit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['gramsPerUnit'],
          message: 'gramsPerUnit is required when baseUnit is unit',
        });
      }
      if (!value.displayUnitLabel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['displayUnitLabel'],
          message: 'displayUnitLabel is required when baseUnit is unit',
        });
      }
    }
  });

function toDbState(value) {
  switch (value) {
    case 'raw':
      return 'RAW';
    case 'dry':
      return 'DRY';
    case 'as_sold':
      return 'AS_SOLD';
    case 'cooked':
      return 'COOKED';
    default:
      throw new Error(`Unhandled state: ${value}`);
  }
}

function toDbSource(value) {
  return value === 'custom' ? 'CUSTOM' : 'SYSTEM';
}

function toDbBaseUnit(value) {
  return value === 'unit' ? 'UNIT' : 'HUNDRED_G';
}

function loadPatch(inputPath) {
  const resolvedPath = path.resolve(process.cwd(), inputPath);
  const raw = fs.readFileSync(resolvedPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!parsed || !Array.isArray(parsed.ingredients)) {
    throw new Error('Invalid patch file: expected root.ingredients array');
  }

  return { resolvedPath, ingredients: parsed.ingredients };
}

async function upsertIngredient(ingredient) {
  const dbData = {
    name: ingredient.name,
    category: ingredient.category,
    state: toDbState(ingredient.state),
    caloriesKcal: ingredient.caloriesKcal,
    proteinG: ingredient.proteinG,
    carbsG: ingredient.carbsG,
    fatG: ingredient.fatG,
    fiberG: ingredient.fiberG ?? null,
    source: toDbSource(ingredient.source),
    isActive: ingredient.isActive,
    sourceRef: ingredient.sourceRef ?? null,
    verifiedAt: ingredient.verifiedAt ? new Date(ingredient.verifiedAt) : null,
    verifiedBy: ingredient.verifiedBy ?? null,
    baseUnit: toDbBaseUnit(ingredient.baseUnit),
    gramsPerUnit: ingredient.gramsPerUnit ?? null,
    displayUnitLabel: ingredient.displayUnitLabel ?? null,
  };

  if (ingredient.id) {
    const byId = await prisma.food.findUnique({ where: { id: ingredient.id }, select: { id: true } });

    if (byId) {
      await prisma.food.update({ where: { id: ingredient.id }, data: dbData });
      return 'updated';
    }

    const byNameState = await prisma.food.findFirst({
      where: {
        name: { equals: ingredient.name, mode: 'insensitive' },
        state: dbData.state,
      },
      select: { id: true },
    });

    if (byNameState) {
      await prisma.food.update({ where: { id: byNameState.id }, data: dbData });
      return 'updated';
    }

    await prisma.food.create({ data: { id: ingredient.id, ...dbData } });
    return 'created';
  }

  const byNameState = await prisma.food.findFirst({
    where: {
      name: { equals: ingredient.name, mode: 'insensitive' },
      state: dbData.state,
    },
    select: { id: true },
  });

  if (byNameState) {
    await prisma.food.update({ where: { id: byNameState.id }, data: dbData });
    return 'updated';
  }

  await prisma.food.create({ data: dbData });
  return 'created';
}

async function main() {
  const inputPath = process.argv[2] || 'scripts/data/ingredient_seed_v4_units_patch_2026_03_07_a.json';
  const { resolvedPath, ingredients } = loadPatch(inputPath);

  console.log(`Using patch file: ${resolvedPath}`);
  console.log(`Found ${ingredients.length} ingredient rows`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const rawIngredient of ingredients) {
    const parsed = inputIngredientSchema.safeParse(rawIngredient);

    if (!parsed.success) {
      skipped += 1;
      const itemName = rawIngredient && rawIngredient.name ? rawIngredient.name : '<unknown>';
      console.warn(`Skipping invalid row: ${itemName}`);
      console.warn(parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; '));
      continue;
    }

    const result = await upsertIngredient(parsed.data);

    if (result === 'created') created += 1;
    if (result === 'updated') updated += 1;
  }

  console.log('--- Import summary ---');
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
}

main()
  .catch(error => {
    console.error('Food patch import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
