/**
 * Compute tags to distinguish USDA foods (raw/cooked/dry/processed/etc.)
 */

import type { NormalizedFoodItem } from '@/types/usda';

const COOKED_KEYWORDS = [
  'cooked',
  'roasted',
  'grilled',
  'baked',
  'fried',
  'steamed',
  'boiled',
  'sauteed',
  'broiled',
  'prepared',
];

const RAW_KEYWORDS = ['raw', 'uncooked'];

const DRY_KEYWORDS = ['dry', 'uncooked'];

const PROCESSED_KEYWORDS = ['bar', 'snack', 'chips', 'chocolate', 'candy', 'biscuit', 'sauce', 'dressing', 'vinegar'];

const STAPLES = ['rice', 'pasta', 'oats', 'lentils'];

function includesAny(value: string, keywords: string[]): boolean {
  return keywords.some(keyword => {
    const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
    return pattern.test(value);
  });
}

function isStaple(value: string): boolean {
  return STAPLES.some(staple => value.includes(staple));
}

export function computeFoodTags(item: NormalizedFoodItem): string[] {
  const tags = new Set<string>();
  const name = item.name.toLowerCase();

  const hasCookedKeyword = includesAny(name, COOKED_KEYWORDS);
  const hasRawKeyword = includesAny(name, RAW_KEYWORDS);
  const hasDryKeyword = includesAny(name, DRY_KEYWORDS);

  if (hasCookedKeyword) {
    tags.add('cooked');
  }

  if (hasRawKeyword) {
    tags.add('raw');
  }

  if (hasDryKeyword && isStaple(name)) {
    tags.add('dry');
  }

  const kcal = item.nutrientsPer100g.kcal ?? null;
  const fat = item.nutrientsPer100g.fat ?? null;
  const protein = item.nutrientsPer100g.protein ?? null;

  // Inference for chicken breast
  const isChickenBreast = name.includes('chicken') && name.includes('breast');
  if (isChickenBreast && !tags.has('raw') && !tags.has('cooked')) {
    if ((kcal !== null && kcal >= 150) || (fat !== null && fat >= 6)) {
      tags.add('cooked');
      tags.add('inferred');
    } else if (kcal !== null && kcal >= 95 && kcal <= 135 && (fat === null || fat <= 5)) {
      tags.add('raw');
      tags.add('inferred');
    }
  }

  // Inference for dry vs cooked staples
  if (isStaple(name) && !tags.has('dry') && !tags.has('cooked')) {
    if (kcal !== null && kcal >= 300) {
      tags.add('dry');
      tags.add('inferred');
    } else if (kcal !== null && kcal <= 180) {
      tags.add('cooked');
      tags.add('inferred');
    }
  }

  // Branded/processed tags
  if (item.dataType === 'Branded' || item.brand) {
    tags.add('branded');
  }

  if (includesAny(name, PROCESSED_KEYWORDS)) {
    tags.add('processed');
  }

  // Lean tag
  if (protein !== null && fat !== null && protein >= 18 && fat <= 5) {
    tags.add('lean');
  }

  // Incomplete tag
  if (item.flags.incompleteNutrition) {
    tags.add('incomplete');
  }

  return Array.from(tags).sort();
}
