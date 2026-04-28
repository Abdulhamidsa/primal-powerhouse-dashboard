import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { decryptOrFallback } from '@/lib/security/field-crypto';
import { getCurrentWeekStartDateKey } from '@/features/weekly-checkin/utils/week';

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
      const rows = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'weekly_check_ins'
          AND lower(column_name) IN ('progressphotofronturl', 'progressphotosideurl', 'progressphotobackurl')
      `;

      const columns = new Set(rows.map(row => row.column_name.toLowerCase()));

      return {
        progressPhotoFrontUrl: columns.has('progressphotofronturl'),
        progressPhotoSideUrl: columns.has('progressphotosideurl'),
        progressPhotoBackUrl: columns.has('progressphotobackurl'),
      };
    } catch (error) {
      console.warn(
        '[ADMIN_WEEKLY_CHECKINS] Could not verify progress photo columns, falling back to no-photo mode:',
        error,
      );
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
  return {
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
    ...(photoColumns.progressPhotoFrontUrl ? { progressPhotoFrontUrl: true } : {}),
    ...(photoColumns.progressPhotoSideUrl ? { progressPhotoSideUrl: true } : {}),
    ...(photoColumns.progressPhotoBackUrl ? { progressPhotoBackUrl: true } : {}),
  };
}

function dateKeyToUtcMidnight(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function toDateKeyUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getWeeklyCheckInStatus(hasCurrentWeekCheckIn: boolean): 'completed' | 'due' | 'overdue' {
  if (hasCurrentWeekCheckIn) return 'completed';

  const day = new Date().getDay();
  if (day === 1 || day === 2) return 'due';

  return 'overdue';
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, user } = requireAuth(request, 'admin');
    if (error || !user) {
      return jsonWithCache({ error: 'Not authorized' }, { status: 401 });
    }

    const { id: clientId } = await params;
    if (!clientId) {
      return jsonWithCache({ error: 'Client id is required' }, { status: 400 });
    }

    const actor = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, role: true },
    });

    const currentWeekStartDateKey = getCurrentWeekStartDateKey();
    const currentWeekStartUtc = dateKeyToUtcMidnight(currentWeekStartDateKey);
    const photoColumns = await getAvailableProgressPhotoColumns();
    const select = buildCheckInSelect(photoColumns);

    const [client, checkIns] = await Promise.all([
      prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true, name: true },
      }),
      prisma.weeklyCheckIn.findMany({
        where: { clientId },
        orderBy: { weekStartDate: 'desc' },
        select,
      }),
    ]);

    if (!client) {
      return jsonWithCache({ error: 'Client not found' }, { status: 404 });
    }

    const reviewedById = new Map<string, Date>();
    if (actor?.role === 'COACH' && checkIns.length > 0) {
      const reviewLogs = await prisma.auditLog.findMany({
        where: {
          actorId: actor.id,
          action: 'WEEKLY_CHECKIN_REVIEWED',
          targetUserId: {
            in: checkIns.map(checkIn => checkIn.id),
          },
        },
        select: {
          targetUserId: true,
          createdAt: true,
        },
      });

      for (const log of reviewLogs) {
        if (!log.targetUserId) continue;
        const current = reviewedById.get(log.targetUserId);
        if (!current || log.createdAt < current) {
          reviewedById.set(log.targetUserId, log.createdAt);
        }
      }
    }

    const currentWeekCheckIn = checkIns.find(
      checkIn => toDateKeyUtc(checkIn.weekStartDate) === toDateKeyUtc(currentWeekStartUtc),
    );

    return jsonWithCache({
      client: {
        id: client.id,
        name: client.name,
      },
      currentWeek: {
        weekStartDate: currentWeekStartDateKey,
        status: getWeeklyCheckInStatus(Boolean(currentWeekCheckIn)),
        checkInId: currentWeekCheckIn?.id ?? null,
      },
      latestCheckIn: checkIns.length
        ? {
            id: checkIns[0].id,
            submittedAt: checkIns[0].submittedAt.toISOString(),
            weekStartDate: toDateKeyUtc(checkIns[0].weekStartDate),
          }
        : null,
      checkIns: checkIns.map(checkIn => {
        const weekKey = toDateKeyUtc(checkIn.weekStartDate);
        const strengthUpdate =
          decryptOrFallback(checkIn.strengthUpdateEncrypted, `weeklyCheckIn:${checkIn.id}:strengthUpdate`) ??
          decryptOrFallback(checkIn.strengthUpdateEncrypted, `weeklyCheckIn:${clientId}:${weekKey}:strengthUpdate`) ??
          checkIn.strengthUpdate ??
          null;
        const blockerText =
          decryptOrFallback(checkIn.blockerTextEncrypted, `weeklyCheckIn:${checkIn.id}:blockerText`) ??
          decryptOrFallback(checkIn.blockerTextEncrypted, `weeklyCheckIn:${clientId}:${weekKey}:blockerText`) ??
          checkIn.blockerText ??
          null;
        const notes =
          decryptOrFallback(checkIn.notesEncrypted, `weeklyCheckIn:${checkIn.id}:notes`) ??
          decryptOrFallback(checkIn.notesEncrypted, `weeklyCheckIn:${clientId}:${weekKey}:notes`) ??
          checkIn.notes ??
          null;
        return {
          id: checkIn.id,
          weekStartDate: weekKey,
          submittedAt: checkIn.submittedAt.toISOString(),
          reviewed: reviewedById.has(checkIn.id),
          reviewedAt: reviewedById.get(checkIn.id)?.toISOString() ?? null,
          weightKg: checkIn.weightKg,
          progressPhotoFrontUrl: 'progressPhotoFrontUrl' in checkIn ? (checkIn.progressPhotoFrontUrl ?? null) : null,
          progressPhotoSideUrl: 'progressPhotoSideUrl' in checkIn ? (checkIn.progressPhotoSideUrl ?? null) : null,
          progressPhotoBackUrl: 'progressPhotoBackUrl' in checkIn ? (checkIn.progressPhotoBackUrl ?? null) : null,
          strengthUpdate,
          blockerText,
          notes,
        };
      }),
    });
  } catch (error) {
    console.error('[ADMIN_WEEKLY_CHECKINS_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to fetch weekly check-ins' }, { status: 500 });
  }
}
