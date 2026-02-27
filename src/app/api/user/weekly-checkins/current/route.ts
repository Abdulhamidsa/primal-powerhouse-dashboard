import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { weekStartDateSchema, weeklyCheckInUpsertSchema } from '@/features/weekly-checkin/schemas/weeklyCheckIn.schema';
import { decryptOrFallback, encryptField } from '@/lib/security/field-crypto';

const weekStartSearchSchema = z.object({
  weekStartDate: weekStartDateSchema,
});

function dateKeyToUtcMidnight(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function formatDateKeyUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shouldKeepPlaintext(): boolean {
  return process.env.PRIVACY_ENCRYPTION_STRICT !== 'true';
}

function serializeCheckIn(record: any) {
  const strengthUpdate =
    decryptOrFallback(record.strengthUpdateEncrypted, `weeklyCheckIn:${record.id}:strengthUpdate`) ??
    record.strengthUpdate;
  const blockerText =
    decryptOrFallback(record.blockerTextEncrypted, `weeklyCheckIn:${record.id}:blockerText`) ?? record.blockerText;
  const notes = decryptOrFallback(record.notesEncrypted, `weeklyCheckIn:${record.id}:notes`) ?? record.notes;

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
    strengthUpdate,
    blockerText,
    notes,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { error, user } = requireAuth(request, 'client');
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

    const checkIn = await (prisma as any).weeklyCheckIn.findUnique({
      where: {
        clientId_weekStartDate: {
          clientId: user.userId,
          weekStartDate: weekStartUtc,
        },
      },
    });

    if (checkIn && (!checkIn.strengthUpdateEncrypted || !checkIn.blockerTextEncrypted || !checkIn.notesEncrypted)) {
      await (prisma as any).weeklyCheckIn.update({
        where: { id: checkIn.id },
        data: {
          strengthUpdateEncrypted: checkIn.strengthUpdate
            ? encryptField(checkIn.strengthUpdate, `weeklyCheckIn:${checkIn.id}:strengthUpdate`)
            : null,
          blockerTextEncrypted: checkIn.blockerText
            ? encryptField(checkIn.blockerText, `weeklyCheckIn:${checkIn.id}:blockerText`)
            : null,
          notesEncrypted: checkIn.notes ? encryptField(checkIn.notes, `weeklyCheckIn:${checkIn.id}:notes`) : null,
        },
      });
    }

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
    const { error, user } = requireAuth(request, 'client');
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

    const record = await (prisma as any).weeklyCheckIn.upsert({
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
        strengthUpdate: shouldKeepPlaintext() ? (payload.strengthUpdate ?? null) : null,
        blockerText: shouldKeepPlaintext() ? (payload.blockerText ?? null) : null,
        notes: shouldKeepPlaintext() ? (payload.notes ?? null) : null,
        strengthUpdateEncrypted: payload.strengthUpdate
          ? encryptField(payload.strengthUpdate, `weeklyCheckIn:${user.userId}:${weekStartDate}:strengthUpdate`)
          : null,
        blockerTextEncrypted: payload.blockerText
          ? encryptField(payload.blockerText, `weeklyCheckIn:${user.userId}:${weekStartDate}:blockerText`)
          : null,
        notesEncrypted: payload.notes
          ? encryptField(payload.notes, `weeklyCheckIn:${user.userId}:${weekStartDate}:notes`)
          : null,
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
        strengthUpdate: shouldKeepPlaintext() ? (payload.strengthUpdate ?? null) : null,
        blockerText: shouldKeepPlaintext() ? (payload.blockerText ?? null) : null,
        notes: shouldKeepPlaintext() ? (payload.notes ?? null) : null,
        strengthUpdateEncrypted: payload.strengthUpdate
          ? encryptField(payload.strengthUpdate, `weeklyCheckIn:${user.userId}:${weekStartDate}:strengthUpdate`)
          : null,
        blockerTextEncrypted: payload.blockerText
          ? encryptField(payload.blockerText, `weeklyCheckIn:${user.userId}:${weekStartDate}:blockerText`)
          : null,
        notesEncrypted: payload.notes
          ? encryptField(payload.notes, `weeklyCheckIn:${user.userId}:${weekStartDate}:notes`)
          : null,
      },
    });

    return jsonWithCache({
      success: true,
      weekStartDate,
      checkIn: serializeCheckIn(record),
    });
  } catch (error) {
    console.error('[WEEKLY_CHECKIN_PUT] Failed:', error);

    const message = String(error);
    if (message.includes('Foreign key constraint') || message.includes('P2003')) {
      return jsonWithCache({ error: 'Client profile not found for this session' }, { status: 400 });
    }

    return jsonWithCache({ error: 'Failed to save weekly check-in' }, { status: 500 });
  }
}
