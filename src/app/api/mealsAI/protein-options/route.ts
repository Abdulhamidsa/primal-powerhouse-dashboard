import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildMainProteinOptions, type ProteinSelectableMealType } from '@/lib/main-protein';
import { requireStaffActor } from '@/lib/api-auth';
import { safeErrorMessage } from '@/lib/security/log-redaction';

const ALLOWED_MEAL_TYPES: ProteinSelectableMealType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

function parseMealType(value: string | null): ProteinSelectableMealType {
  if (!value) return 'LUNCH';
  const normalized = value.toUpperCase();
  if (ALLOWED_MEAL_TYPES.includes(normalized as ProteinSelectableMealType)) {
    return normalized as ProteinSelectableMealType;
  }
  return 'LUNCH';
}

export async function GET(request: import('next/server').NextRequest) {
  try {
    const auth = await requireStaffActor(request);
    if (!auth.ok) return auth.res;

    const url = new URL(request.url);
    const mealType = parseMealType(url.searchParams.get('mealType'));

    const foods = await (prisma as any).food.findMany({
      where: { isActive: true },
      select: {
        name: true,
        aliases: {
          select: {
            alias: true,
          },
        },
        proteinG: true,
        caloriesKcal: true,
      },
      take: 2500,
    });

    const options = buildMainProteinOptions(foods, mealType).slice(0, 14);

    return NextResponse.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error('Meal protein options error:', safeErrorMessage(error));
    return NextResponse.json({ success: false, message: 'Failed to fetch meal protein options' }, { status: 500 });
  }
}
