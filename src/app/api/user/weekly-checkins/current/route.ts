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

let progressPhotoColumnsAvailablePromise: Promise<boolean> | null = null;

async function hasProgressPhotoColumns(): Promise<boolean> {
  if (progressPhotoColumnsAvailablePromise) {
    return progressPhotoColumnsAvailablePromise;
  }

  progressPhotoColumnsAvailablePromise = (async () => {
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
        `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'weekly_check_ins'
            AND column_name IN ('progressPhotoFrontUrl', 'progressPhotoSideUrl', 'progressPhotoBackUrl')
        `,
      );

      const columns = new Set(rows.map(row => row.column_name));
      return (
        columns.has('progressPhotoFrontUrl') &&
        columns.has('progressPhotoSideUrl') &&
        columns.has('progressPhotoBackUrl')
      );
    } catch (error) {
      console.warn('[WEEKLY_CHECKIN] Could not verify progress photo columns, falling back to no-photo mode:', error);
      return false;
    }
  })();

  return progressPhotoColumnsAvailablePromise;
}

function buildCheckInSelect(includePhotos: boolean) {
  const baseSelect = {
    id: true,
    weekStartDate: true,
    submittedAt: true,
    weightKg: true,
    strengthUpdate: true,
    blockerText: true,
    notes: true,
    strengthUpdateEncrypted: true,
    blockerTextEncrypted: true,
    notesEncrypted: true,
  };

  if (!includePhotos) {
    return baseSelect;
  }

  return {
    ...baseSelect,
    progressPhotoFrontUrl: true,
    progressPhotoSideUrl: true,
    progressPhotoBackUrl: true,
  };
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
    progressPhotoFrontUrl: record.progressPhotoFrontUrl ?? null,
    progressPhotoSideUrl: record.progressPhotoSideUrl ?? null,
    progressPhotoBackUrl: record.progressPhotoBackUrl ?? null,
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
    const includePhotos = await hasProgressPhotoColumns();
    const select = buildCheckInSelect(includePhotos);

    const checkIn = await (prisma as any).weeklyCheckIn.findUnique({
      where: {
        clientId_weekStartDate: {
          clientId: user.userId,
          weekStartDate: weekStartUtc,
        },
      },
      select,
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
        select,
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
    const includePhotos = await hasProgressPhotoColumns();
    const select = buildCheckInSelect(includePhotos);

    const updateBase = {
      submittedAt: new Date(),
      weightKg: payload.weightKg ?? null,
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
    };

    const createBase = {
      clientId: user.userId,
      weekStartDate: weekStartUtc,
      submittedAt: new Date(),
      weightKg: payload.weightKg ?? null,
      trainingAdherence: 0,
      nutritionAdherence: 0,
      energyRating: 3,
      stressRating: null,
      hungerRating: null,
      digestionRating: null,
      sleepHours: null,
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
    };

    const updateData = includePhotos
      ? {
          ...updateBase,
          progressPhotoFrontUrl: payload.progressPhotoFrontUrl ?? null,
          progressPhotoSideUrl: payload.progressPhotoSideUrl ?? null,
          progressPhotoBackUrl: payload.progressPhotoBackUrl ?? null,
        }
      : updateBase;

    const createData = includePhotos
      ? {
          ...createBase,
          progressPhotoFrontUrl: payload.progressPhotoFrontUrl ?? null,
          progressPhotoSideUrl: payload.progressPhotoSideUrl ?? null,
          progressPhotoBackUrl: payload.progressPhotoBackUrl ?? null,
        }
      : createBase;

    const record = await (prisma as any).weeklyCheckIn.upsert({
      where: {
        clientId_weekStartDate: {
          clientId: user.userId,
          weekStartDate: weekStartUtc,
        },
      },
      update: updateData,
      create: createData,
      select,
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
