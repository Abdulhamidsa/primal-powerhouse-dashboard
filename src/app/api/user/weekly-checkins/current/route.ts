import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import {
  weekStartDateSchema,
  weeklyCheckInUpsertSchema,
} from '@/features/weekly-checkin/schemas/weeklyCheckIn.schema';

const weekStartSearchSchema = z.object({
  weekStartDate: weekStartDateSchema,
});

function dateKeyToUtcMidnight(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function formatDateKeyUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function serializeCheckIn(record: {
  id: string;
  weekStartDate: Date;
  submittedAt: Date;
  weightKg: number | null;
  waistCm: number | null;
  trainingAdherence: number;
  nutritionAdherence: number;
  energyRating: number;
  stressRating: number | null;
  hungerRating: number | null;
  digestionRating: number | null;
  sleepHours: number | null;
  strengthUpdate: string | null;
  blockerText: string | null;
  notes: string | null;
}) {
  return {
    id: record.id,
    weekStartDate: formatDateKeyUtc(record.weekStartDate),
    submittedAt: record.submittedAt.toISOString(),
    weightKg: record.weightKg,
    waistCm: record.waistCm,
    trainingAdherence: record.trainingAdherence,
    nutritionAdherence: record.nutritionAdherence,
    energyRating: record.energyRating,
    stressRating: record.stressRating,
    hungerRating: record.hungerRating,
    digestionRating: record.digestionRating,
    sleepHours: record.sleepHours,
    strengthUpdate: record.strengthUpdate,
    blockerText: record.blockerText,
    notes: record.notes,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { error, user } = requireAuth(request);
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsedQuery = weekStartSearchSchema.safeParse({
      weekStartDate: request.nextUrl.searchParams.get('weekStartDate') ?? '',
    });

    if (!parsedQuery.success) {
      return jsonWithCache({ error: 'Invalid weekStartDate' }, { status: 400 });
    }

    const weekStartDate = parsedQuery.data.weekStartDate;
    const weekStartUtc = dateKeyToUtcMidnight(weekStartDate);

    const checkIn = await prisma.weeklyCheckIn.findUnique({
      where: {
        clientId_weekStartDate: {
          clientId: user.userId,
          weekStartDate: weekStartUtc,
        },
      },
    });

    return jsonWithCache({
      weekStartDate,
      checkIn: checkIn ? serializeCheckIn(checkIn) : null,
    });
  } catch (error) {
    console.error('[WEEKLY_CHECKIN_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to load weekly check-in' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, user } = requireAuth(request);
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const parsed = weeklyCheckInUpsertSchema.safeParse(json);

    if (!parsed.success) {
      return jsonWithCache({ error: 'Invalid weekly check-in payload' }, { status: 400 });
    }

    const { weekStartDate, payload } = parsed.data;
    const weekStartUtc = dateKeyToUtcMidnight(weekStartDate);

    const record = await prisma.weeklyCheckIn.upsert({
      where: {
        clientId_weekStartDate: {
          clientId: user.userId,
          weekStartDate: weekStartUtc,
        },
      },
      update: {
        submittedAt: new Date(),
        weightKg: payload.weightKg ?? null,
        waistCm: payload.waistCm ?? null,
        trainingAdherence: payload.trainingAdherence,
        nutritionAdherence: payload.nutritionAdherence,
        energyRating: payload.energyRating,
        stressRating: payload.stressRating,
        hungerRating: payload.hungerRating,
        digestionRating: payload.digestionRating,
        sleepHours: payload.sleepHours ?? null,
        strengthUpdate: payload.strengthUpdate ?? null,
        blockerText: payload.blockerText ?? null,
        notes: payload.notes ?? null,
      },
      create: {
        clientId: user.userId,
        weekStartDate: weekStartUtc,
        submittedAt: new Date(),
        weightKg: payload.weightKg ?? null,
        waistCm: payload.waistCm ?? null,
        trainingAdherence: payload.trainingAdherence,
        nutritionAdherence: payload.nutritionAdherence,
        energyRating: payload.energyRating,
        stressRating: payload.stressRating,
        hungerRating: payload.hungerRating,
        digestionRating: payload.digestionRating,
        sleepHours: payload.sleepHours ?? null,
        strengthUpdate: payload.strengthUpdate ?? null,
        blockerText: payload.blockerText ?? null,
        notes: payload.notes ?? null,
      },
    });

    return jsonWithCache({
      success: true,
      weekStartDate,
      checkIn: serializeCheckIn(record),
    });
  } catch (error) {
    console.error('[WEEKLY_CHECKIN_PUT] Failed:', error);
    return jsonWithCache({ error: 'Failed to save weekly check-in' }, { status: 500 });
  }
}
