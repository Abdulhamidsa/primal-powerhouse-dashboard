import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { clientHasCoachingAccess, coachingAccessDeniedResponse } from '@/lib/auth/client-access';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { invalidateUserDashboardSummaryCaches } from '@/lib/cache-tags';
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

function encryptOrKeepPlaintext(value: string | null | undefined, context: string): string | null {
  if (!value) return null;

  try {
    return encryptField(value, context);
  } catch (error) {
    console.warn('[WEEKLY_CHECKIN] Encryption unavailable, storing plaintext for now:', error);
    return value;
  }
}

type ProgressPhotoColumnMap = {
  progressPhotoFrontUrl: boolean;
  progressPhotoSideUrl: boolean;
  progressPhotoBackUrl: boolean;
};

let progressPhotoColumnsAvailablePromise: Promise<ProgressPhotoColumnMap> | null = null;

async function getAvailableProgressPhotoColumns(): Promise<ProgressPhotoColumnMap> {
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
            AND lower(column_name) IN ('progressphotofronturl', 'progressphotosideurl', 'progressphotobackurl')
        `,
      );

      const columns = new Set(rows.map(row => row.column_name.toLowerCase()));

      return {
        progressPhotoFrontUrl: columns.has('progressphotofronturl'),
        progressPhotoSideUrl: columns.has('progressphotosideurl'),
        progressPhotoBackUrl: columns.has('progressphotobackurl'),
      };
    } catch (error) {
      console.warn('[WEEKLY_CHECKIN] Could not verify progress photo columns, falling back to no-photo mode:', error);
      return {
        progressPhotoFrontUrl: false,
        progressPhotoSideUrl: false,
        progressPhotoBackUrl: false,
      };
    }
  })();

  return progressPhotoColumnsAvailablePromise;
}

function buildCheckInSelect(photoColumns: ProgressPhotoColumnMap) {
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

  return {
    ...baseSelect,
    ...(photoColumns.progressPhotoFrontUrl ? { progressPhotoFrontUrl: true } : {}),
    ...(photoColumns.progressPhotoSideUrl ? { progressPhotoSideUrl: true } : {}),
    ...(photoColumns.progressPhotoBackUrl ? { progressPhotoBackUrl: true } : {}),
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
    const { error, user } = await requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await clientHasCoachingAccess(user.userId))) return coachingAccessDeniedResponse();

    const parsedQuery = weekStartSearchSchema.safeParse({
      weekStartDate: request.nextUrl.searchParams.get('weekStartDate') ?? '',
    });

    if (!parsedQuery.success) {
      return jsonWithCache({ error: 'Invalid weekStartDate' }, { status: 400 });
    }

    const weekStartDate = parsedQuery.data.weekStartDate;
    const weekStartUtc = dateKeyToUtcMidnight(weekStartDate);
    const photoColumns = await getAvailableProgressPhotoColumns();
    const select = buildCheckInSelect(photoColumns);

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
          strengthUpdateEncrypted: encryptOrKeepPlaintext(
            checkIn.strengthUpdate,
            `weeklyCheckIn:${checkIn.id}:strengthUpdate`,
          ),
          blockerTextEncrypted: encryptOrKeepPlaintext(checkIn.blockerText, `weeklyCheckIn:${checkIn.id}:blockerText`),
          notesEncrypted: encryptOrKeepPlaintext(checkIn.notes, `weeklyCheckIn:${checkIn.id}:notes`),
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
    const { error, user } = await requireAuth(request, 'client');
    if (error || !user) {
      return jsonWithCache({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await clientHasCoachingAccess(user.userId))) return coachingAccessDeniedResponse();

    const json = await request.json();
    const parsed = weeklyCheckInUpsertSchema.safeParse(json);

    if (!parsed.success) {
      return jsonWithCache({ error: 'Invalid weekly check-in payload' }, { status: 400 });
    }

    const { weekStartDate, payload } = parsed.data;
    const weekStartUtc = dateKeyToUtcMidnight(weekStartDate);
    const photoColumns = await getAvailableProgressPhotoColumns();
    const select = buildCheckInSelect(photoColumns);

    const updateBase = {
      submittedAt: new Date(),
      weightKg: payload.weightKg ?? null,
      strengthUpdate: shouldKeepPlaintext() ? (payload.strengthUpdate ?? null) : null,
      blockerText: shouldKeepPlaintext() ? (payload.blockerText ?? null) : null,
      notes: shouldKeepPlaintext() ? (payload.notes ?? null) : null,
      strengthUpdateEncrypted: encryptOrKeepPlaintext(
        payload.strengthUpdate,
        `weeklyCheckIn:${user.userId}:${weekStartDate}:strengthUpdate`,
      ),
      blockerTextEncrypted: encryptOrKeepPlaintext(
        payload.blockerText,
        `weeklyCheckIn:${user.userId}:${weekStartDate}:blockerText`,
      ),
      notesEncrypted: encryptOrKeepPlaintext(payload.notes, `weeklyCheckIn:${user.userId}:${weekStartDate}:notes`),
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
      strengthUpdateEncrypted: encryptOrKeepPlaintext(
        payload.strengthUpdate,
        `weeklyCheckIn:${user.userId}:${weekStartDate}:strengthUpdate`,
      ),
      blockerTextEncrypted: encryptOrKeepPlaintext(
        payload.blockerText,
        `weeklyCheckIn:${user.userId}:${weekStartDate}:blockerText`,
      ),
      notesEncrypted: encryptOrKeepPlaintext(payload.notes, `weeklyCheckIn:${user.userId}:${weekStartDate}:notes`),
    };

    const updateData = {
      ...updateBase,
      ...(photoColumns.progressPhotoFrontUrl ? { progressPhotoFrontUrl: payload.progressPhotoFrontUrl ?? null } : {}),
      ...(photoColumns.progressPhotoSideUrl ? { progressPhotoSideUrl: payload.progressPhotoSideUrl ?? null } : {}),
      ...(photoColumns.progressPhotoBackUrl ? { progressPhotoBackUrl: payload.progressPhotoBackUrl ?? null } : {}),
    };

    const createData = {
      ...createBase,
      ...(photoColumns.progressPhotoFrontUrl ? { progressPhotoFrontUrl: payload.progressPhotoFrontUrl ?? null } : {}),
      ...(photoColumns.progressPhotoSideUrl ? { progressPhotoSideUrl: payload.progressPhotoSideUrl ?? null } : {}),
      ...(photoColumns.progressPhotoBackUrl ? { progressPhotoBackUrl: payload.progressPhotoBackUrl ?? null } : {}),
    };

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

    invalidateUserDashboardSummaryCaches({ clientId: user.userId });

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
