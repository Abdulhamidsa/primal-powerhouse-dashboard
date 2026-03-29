import { NextResponse } from 'next/server';
import { azureOpenAI, AZURE_CHAT_DEPLOYMENT } from '@/lib/azure-openai';
import { prisma } from '@/lib/prisma';
import {
  generateSideSchema,
  generatedSideTemplateSchema,
  sideFoodOriginSchema,
} from '@/features/sides/schemas/side.schema';
import {
  isMissingSideItemsTableError,
  normalizeSideArray,
  resolveCoachId,
  serializeSideArray,
  toSideResponse,
} from '@/features/sides/utils/sideStorage';

const DEFAULT_SIDE_SPICES = ['sea salt', 'black pepper', 'garlic', 'lemon zest'] as const;

function resolveValidFoodOrigin(input: { requestedOrigin?: string; aiOrigin?: unknown }): string | undefined {
  if (input.requestedOrigin) {
    return input.requestedOrigin;
  }

  if (typeof input.aiOrigin !== 'string') {
    return undefined;
  }

  const parsed = sideFoodOriginSchema.safeParse(input.aiOrigin);
  return parsed.success ? parsed.data : undefined;
}

function buildSidePrompt(input: {
  mealType: 'LUNCH' | 'DINNER';
  sideType: 'SALAD' | 'SOUP';
  foodOrigin?: string;
}): string {
  const typeInstruction =
    input.sideType === 'SALAD'
      ? 'Create a composed salad side with texture, acidity, herbs, and clear flavor contrast.'
      : 'Create a light soup side with clean broth or blended vegetable depth, bright aromatics, and clear seasoning.';

  const originInstruction = input.foodOrigin
    ? `The side must clearly reflect ${input.foodOrigin} flavor cues and naming. Do not drift into another cuisine.`
    : 'Pick a cuisine direction that feels distinct, appetizing, and not repetitive.';

  return [
    `Generate one ${input.sideType.toLowerCase()} side for a ${input.mealType.toLowerCase()} main meal.`,
    'The side must feel creative, restaurant-quality, colorful, and highly appetizing.',
    'Keep it coach-friendly and practical: short ingredient list, straightforward prep, no exotic hard-to-source items.',
    'Calories must stay at or below 80 kcal for one serving.',
    'Use herbs, spices, citrus, aromatics, or seasoning so the side feels flavorful rather than bland.',
    typeInstruction,
    originInstruction,
    'Return strict JSON only with keys: name, type, calories, protein, carbs, fat, fiber, ingredients, spices, instructions, foodOrigin.',
    'ingredients must be an array of plain strings.',
    'spices must be an array of plain strings.',
    'instructions must be 2 to 4 concise cooking steps.',
  ].join(' ');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = generateSideSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const response = await azureOpenAI.chat.completions.create({
      model: AZURE_CHAT_DEPLOYMENT as string,
      temperature: 0.6,
      messages: [
        { role: 'system', content: 'Return strict JSON only. No markdown.' },
        {
          role: 'user',
          content: buildSidePrompt({
            mealType: parsed.data.mealType,
            sideType: parsed.data.sideType,
            foodOrigin: parsed.data.foodOrigin,
          }),
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 502 });
    }

    const json = JSON.parse(content);
    const template = generatedSideTemplateSchema.parse({
      ...json,
      type: parsed.data.sideType,
      foodOrigin: resolveValidFoodOrigin({
        requestedOrigin: parsed.data.foodOrigin,
        aiOrigin: json.foodOrigin,
      }),
      spices: normalizeSideArray(json.spices?.length ? json.spices : [...DEFAULT_SIDE_SPICES]),
      ingredients: normalizeSideArray(json.ingredients),
      instructions: normalizeSideArray(json.instructions),
    });

    const coachId = await resolveCoachId();
    const createdSide = await prisma.sideItem.create({
      data: {
        name: template.name,
        type: template.type,
        calories: template.calories,
        protein: template.protein,
        carbs: template.carbs,
        fat: template.fat,
        fiber: template.fiber ?? null,
        ingredients: serializeSideArray(template.ingredients),
        spices: serializeSideArray(template.spices),
        instructions: serializeSideArray(template.instructions),
        foodOrigin: template.foodOrigin ?? null,
        clientId: parsed.data.clientId ?? null,
        coachId,
      },
    });

    return NextResponse.json(toSideResponse(createdSide), { status: 201 });
  } catch (error) {
    if (isMissingSideItemsTableError(error)) {
      return NextResponse.json(
        { error: 'Side items table is not deployed yet. Run the side migration first.' },
        { status: 503 },
      );
    }

    console.error('Error generating side:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate side' },
      { status: 500 },
    );
  }
}
