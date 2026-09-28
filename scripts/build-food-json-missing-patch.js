 
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const INPUT_PATH = process.argv[2] || 'c:/Users/alsaa/Downloads/food.json';
const OUTPUT_PATH = process.argv[3] || 'scripts/data/ingredient_seed_v5_frida_food_json_missing_only.importable.json';

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function parseNum(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

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
      return 'AS_SOLD';
  }
}

function inferState(name) {
  const text = name.toLowerCase();

  if (/(raw|\br[åa]\b)/.test(text)) return 'raw';
  if (/(dried|dry|powder|flour)/.test(text)) return 'dry';
  if (/(boiled|cooked|baked|fried|grilled|roasted|stewed|steamed)/.test(text)) return 'cooked';

  return 'as_sold';
}

function inferCategory(name) {
  const text = name.toLowerCase();

  const proteinWords = [
    'chicken',
    'turkey',
    'beef',
    'pork',
    'veal',
    'lamb',
    'rabbit',
    'duck',
    'fish',
    'salmon',
    'tuna',
    'cod',
    'shrimp',
    'prawn',
    'mussel',
    'oyster',
    'octopus',
    'squid',
    'egg',
    'ham',
    'bacon',
    'protein',
  ];

  const dairyWords = ['milk', 'yogurt', 'yoghurt', 'skyr', 'quark', 'cheese', 'kefir', 'cream'];

  const fruitWords = [
    'apple',
    'banana',
    'orange',
    'pear',
    'kiwi',
    'grape',
    'berry',
    'strawberry',
    'raspberry',
    'blueberry',
    'plum',
    'peach',
    'apricot',
    'pomegranate',
    'melon',
    'watermelon',
    'lemon',
    'lime',
    'nectarine',
    'fig',
    'date',
    'raisin',
    'fruit',
  ];

  const vegetableWords = [
    'broccoli',
    'spinach',
    'tomato',
    'cucumber',
    'carrot',
    'onion',
    'zucchini',
    'eggplant',
    'lettuce',
    'pepper',
    'radish',
    'asparagus',
    'leek',
    'pumpkin',
    'kale',
    'cauliflower',
    'mushroom',
    'cabbage',
    'artichoke',
    'sprout',
    'fennel',
    'parsnip',
    'turnip',
    'chard',
    'bok choy',
    'endive',
    'watercress',
    'arugula',
    'vegetable',
  ];

  const fatWords = [
    'oil',
    'butter',
    'ghee',
    'mayo',
    'mayonnaise',
    'seed',
    'nut',
    'almond',
    'walnut',
    'peanut',
    'sesame',
    'avocado',
  ];

  if (proteinWords.some(word => text.includes(word))) return 'protein';
  if (dairyWords.some(word => text.includes(word))) return 'dairy';
  if (fruitWords.some(word => text.includes(word))) return 'fruit';
  if (vegetableWords.some(word => text.includes(word))) return 'vegetable';
  if (fatWords.some(word => text.includes(word))) return 'fat';

  if (
    /(bread|rice|pasta|noodle|oat|grain|barley|wheat|rye|corn|bean|lentil|chickpea|potato|quinoa|bulgur|carb)/.test(
      text
    )
  ) {
    return 'carb';
  }

  return 'extra';
}

function loadFoodJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  const wrapped = `[${raw}]`;
  return JSON.parse(wrapped);
}

async function main() {
  const resolvedInput = path.resolve(process.cwd(), INPUT_PATH);
  const resolvedOutput = path.resolve(process.cwd(), OUTPUT_PATH);

  const rows = loadFoodJson(resolvedInput);
  if (!Array.isArray(rows) || rows.length < 4) {
    throw new Error('Unexpected food.json shape; expected object-list with header rows');
  }

  // Rows 0-2 are metadata/header rows in this export format.
  const dataRows = rows.slice(3);

  const existingFoods = await prisma.food.findMany({
    select: { id: true, name: true, state: true },
  });

  const existingIds = new Set(existingFoods.map(food => food.id));
  const existingNameState = new Set(existingFoods.map(food => `${food.name.trim().toLowerCase()}|${food.state}`));

  const seenLocalIds = new Set();
  const seenLocalNameState = new Set();

  const ingredients = [];

  let skippedMissingCore = 0;
  let skippedExistingId = 0;
  let skippedExistingNameState = 0;
  let skippedDuplicateInSource = 0;

  for (const row of dataRows) {
    const danishName = (row.Column1 || '').toString().trim();
    const englishName = (row.Column2 || '').toString().trim();
    const name = englishName || danishName;

    const kcal = parseNum(row['Energi (kcal)']);
    const protein = parseNum(row.Protein);
    const carbs = parseNum(row['Tilgængelig kulhydrat']) ?? parseNum(row['Kulhydrat difference']);
    const fat = parseNum(row.Fedt);
    const fiber = parseNum(row.Kostfibre);

    if (!name || kcal === null || protein === null || carbs === null || fat === null) {
      skippedMissingCore += 1;
      continue;
    }

    const state = inferState(name);
    const category = inferCategory(name);
    const dbState = toDbState(state);

    const id = `${slugify(name)}_${state}`.slice(0, 90);
    const nameStateKey = `${name.toLowerCase()}|${dbState}`;

    if (existingIds.has(id)) {
      skippedExistingId += 1;
      continue;
    }

    if (existingNameState.has(nameStateKey)) {
      skippedExistingNameState += 1;
      continue;
    }

    if (seenLocalIds.has(id) || seenLocalNameState.has(nameStateKey)) {
      skippedDuplicateInSource += 1;
      continue;
    }

    seenLocalIds.add(id);
    seenLocalNameState.add(nameStateKey);

    const fridaFoodId = row['→ParameterNavn'];
    const sourceRef = `dataset:Frida food.json | foodId:${fridaFoodId} | foodName:${name} | country:DK`.slice(0, 200);

    ingredients.push({
      id,
      name,
      category,
      state,
      caloriesKcal: Number(kcal.toFixed(1)),
      proteinG: Number(protein.toFixed(1)),
      carbsG: Number(carbs.toFixed(1)),
      fatG: Number(fat.toFixed(1)),
      fiberG: fiber === null ? 0 : Number(fiber.toFixed(1)),
      source: 'system',
      isActive: true,
      sourceRef,
      verifiedAt: '2026-03-07T00:00:00Z',
      verifiedBy: 'system_import',
      baseUnit: '100g',
      gramsPerUnit: null,
      displayUnitLabel: null,
    });
  }

  const out = {
    schemaVersion: 'ingredient_seed_v5_frida_food_json_missing_only',
    basedOnSchemaVersion: 'ingredient_seed_v5_current',
    generatedAt: new Date().toISOString(),
    basisAmount: 100,
    basisUnit: 'g',
    nutritionStandard: 'per_100g',
    ingredients,
    summary: {
      totalSourceRows: dataRows.length,
      totalPreparedForImport: ingredients.length,
      skippedMissingCore,
      skippedExistingId,
      skippedExistingNameState,
      skippedDuplicateInSource,
    },
  };

  fs.writeFileSync(resolvedOutput, JSON.stringify(out, null, 2));

  console.log(`Prepared patch: ${resolvedOutput}`);
  console.log(out.summary);
}

main()
  .catch(error => {
    console.error('Build failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
