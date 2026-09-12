import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';
import { requireApiAuth } from '@/lib/api-auth';
import { resolveActor } from '@/lib/chat/conversation';
import { jsonWithCache } from '@/lib/cacheHeaders';
import { prisma } from '@/lib/prisma';
import { getCurrentWeekStartDateKey } from '@/features/weekly-checkin/utils/week';
import type {
  AdminCommandCenterResponse,
  CommandCenterAction,
  CommandCenterAttentionGroup,
  CommandCenterAttentionItem,
  CommandCenterIssue,
  CommandCenterRecentChange,
  CommandCenterSeverity,
  CommandCenterTodayAction,
} from '@/features/admin-command-center/types/adminCommandCenter.types';

type UnreadRow = {
  conversationId: string;
  clientId: string;
  unreadCount: number | bigint;
  lastUnreadAt: Date | null;
};

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TWO_DAYS_MS = 2 * ONE_DAY_MS;
const THREE_DAYS_MS = 3 * ONE_DAY_MS;

const ATTENTION_ORDER: Record<CommandCenterSeverity, number> = {
  critical: 0,
  warning: 1,
  watch: 2,
};

type RawIssue = {
  id: string;
  severity: CommandCenterSeverity;
  clientId: string;
  clientName: string;
  title: string;
  detail: string;
  occurredAt: string;
  actions: CommandCenterAction[];
};

function mergeActions(existing: CommandCenterAction[], incoming: CommandCenterAction[]): CommandCenterAction[] {
  const result = [...existing];

  for (const action of incoming) {
    const key = `${action.kind}:${action.checkInId ?? ''}`;
    const alreadyExists = result.some(current => `${current.kind}:${current.checkInId ?? ''}` === key);
    if (!alreadyExists) {
      result.push(action);
    }
  }

  return result;
}

function summarizeIssues(issues: CommandCenterIssue[]): { title: string; detail: string } {
  if (issues.length === 1) {
    return {
      title: issues[0].title,
      detail: issues[0].detail,
    };
  }

  const topIssueTitles = issues
    .slice(0, 2)
    .map(issue => issue.title)
    .join(' • ');

  return {
    title: `${issues.length} active issues`,
    detail: topIssueTitles,
  };
}

function createClientHref(clientId: string, action?: 'assign-meal' | 'assign-workout'): string {
  const searchParams = new URLSearchParams({ clientId });
  if (action) searchParams.set('action', action);
  return `/admin/clients?${searchParams.toString()}`;
}

function createBaseActions(clientId: string, messageTemplate: string): CommandCenterAction[] {
  return [
    {
      kind: 'quick_message',
      label: 'Quick Message',
      clientId,
      messageTemplate,
    },
    {
      kind: 'assign_meal',
      label: 'Assign Meal',
      clientId,
      href: createClientHref(clientId, 'assign-meal'),
    },
    {
      kind: 'assign_workout',
      label: 'Assign Workout',
      clientId,
      href: createClientHref(clientId, 'assign-workout'),
    },
    {
      kind: 'open_client',
      label: 'Open Client',
      clientId,
      href: createClientHref(clientId),
    },
  ];
}

function getWeeklyCheckInSeverity(hasCurrentWeekCheckIn: boolean): 'completed' | 'due' | 'overdue' {
  if (hasCurrentWeekCheckIn) return 'completed';

  const day = new Date().getDay();
  if (day === 1 || day === 2) return 'due';

  return 'overdue';
}

function toIso(date: Date): string {
  return date.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth(request, 'admin');
    if (!auth.ok) return auth.res;

    const actor = await resolveActor(auth.user);
    if (!actor || actor.type !== 'coach') {
      return jsonWithCache({ error: 'Coach access required for command center' }, { status: 403 });
    }

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + ONE_DAY_MS);
    const currentWeekStart = new Date(`${getCurrentWeekStartDateKey()}T00:00:00.000Z`);

    const clients = await prisma.client.findMany({
      where: {
        coachId: actor.coachId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        targetWeight: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!clients.length) {
      const empty: AdminCommandCenterResponse = {
        generatedAt: now.toISOString(),
        attention: [
          { severity: 'critical', label: 'Critical', items: [] },
          { severity: 'warning', label: 'Warning', items: [] },
          { severity: 'watch', label: 'Watch', items: [] },
        ],
        todayActions: [],
        momentum: [],
        recentChanges: [],
        compactMetrics: {
          clientsNeedingAttention: 0,
          quickRepliesPending: 0,
          sessionsToday: 0,
        },
      };

      return jsonWithCache(empty);
    }

    const clientIds = clients.map(client => client.id);

    const [
      conversations,
      unreadRows,
      thisWeekCheckIns,
      latestCheckIns,
      latestWorkouts,
      workoutCountRows,
      latestNutritionRows,
      activeMealPlanRows,
      videoAssignmentRows,
      sessionsToday,
      recentNutritionLogs,
      reviewedLogs,
    ] = await Promise.all([
      prisma.conversation.findMany({
        where: { coachId: actor.coachId, clientId: { in: clientIds } },
        select: {
          id: true,
          clientId: true,
          lastMessageAt: true,
        },
      }),
      prisma.$queryRaw<UnreadRow[]>(Prisma.sql`
        SELECT
          c."id" AS "conversationId",
          c."clientId" AS "clientId",
          COUNT(m."id")::int AS "unreadCount",
          MAX(m."createdAt") AS "lastUnreadAt"
        FROM "conversations" c
        LEFT JOIN "messages" m
          ON m."conversationId" = c."id"
          AND (c."coachLastReadAt" IS NULL OR m."createdAt" > c."coachLastReadAt")
          AND m."senderRole" = 'CLIENT'
        WHERE c."coachId" = ${actor.coachId}
          AND c."clientId" IN (${Prisma.join(clientIds)})
        GROUP BY c."id", c."clientId"
        HAVING COUNT(m."id") > 0
      `),
      prisma.weeklyCheckIn.findMany({
        where: {
          clientId: { in: clientIds },
          weekStartDate: currentWeekStart,
        },
        select: {
          id: true,
          clientId: true,
          submittedAt: true,
        },
      }),
      prisma.weeklyCheckIn.findMany({
        where: { clientId: { in: clientIds } },
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          clientId: true,
          submittedAt: true,
          weightKg: true,
        },
        take: Math.max(200, clientIds.length * 6),
      }),
      prisma.workout.groupBy({
        by: ['clientId'],
        where: { clientId: { in: clientIds } },
        _max: { date: true },
      }),
      prisma.workout.groupBy({
        by: ['clientId'],
        where: { clientId: { in: clientIds } },
        _count: { _all: true },
      }),
      prisma.dailyNutritionLog.groupBy({
        by: ['clientId'],
        where: { clientId: { in: clientIds } },
        _max: { dayDate: true },
      }),
      prisma.mealPlan.groupBy({
        by: ['clientId'],
        where: {
          clientId: { in: clientIds },
          isActive: true,
        },
        _count: { _all: true },
      }),
      prisma.videoAssignment.groupBy({
        by: ['clientId'],
        where: { clientId: { in: clientIds } },
        _count: { _all: true },
      }),
      prisma.session.findMany({
        where: {
          coachId: actor.coachId,
          status: 'SCHEDULED',
          date: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
        orderBy: { date: 'asc' },
        include: {
          client: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.dailyNutritionLog.findMany({
        where: {
          clientId: { in: clientIds },
          dayDate: { gte: new Date(now.getTime() - TWO_DAYS_MS) },
        },
        orderBy: { dayDate: 'desc' },
        select: {
          id: true,
          clientId: true,
          dayDate: true,
          status: true,
        },
      }),
      prisma.auditLog.findMany({
        where: {
          actorId: actor.userId,
          action: 'WEEKLY_CHECKIN_REVIEWED',
        },
        select: {
          targetUserId: true,
        },
        take: 500,
      }),
    ]);

    const clientById = new Map(clients.map(client => [client.id, client]));
    const conversationCountByClient = new Map<string, number>();

    for (const conversation of conversations) {
      conversationCountByClient.set(
        conversation.clientId,
        (conversationCountByClient.get(conversation.clientId) ?? 0) + 1
      );
    }

    const unreadByClient = new Map<string, { unreadCount: number; lastUnreadAt: Date | null }>();
    for (const row of unreadRows) {
      unreadByClient.set(row.clientId, {
        unreadCount: Number(row.unreadCount),
        lastUnreadAt: row.lastUnreadAt,
      });
    }

    const thisWeekCheckInByClient = new Map(thisWeekCheckIns.map(checkIn => [checkIn.clientId, checkIn]));
    const latestWorkoutByClient = new Map(
      latestWorkouts.map(item => [item.clientId, item._max.date ?? null])
    );
    const workoutCountByClient = new Map(
      workoutCountRows.map(item => [item.clientId, item._count._all])
    );
    const latestNutritionByClient = new Map(
      latestNutritionRows.map(item => [item.clientId, item._max.dayDate ?? null])
    );
    const activeMealPlansByClient = new Map(
      activeMealPlanRows.map(item => [item.clientId, item._count._all])
    );
    const videoAssignmentsByClient = new Map(
      videoAssignmentRows.map(item => [item.clientId, item._count._all])
    );

    const latestCheckInsByClient = new Map<string, typeof latestCheckIns>();
    for (const checkIn of latestCheckIns) {
      const entries = latestCheckInsByClient.get(checkIn.clientId) ?? [];
      if (entries.length < 5) {
        entries.push(checkIn);
      }
      latestCheckInsByClient.set(checkIn.clientId, entries);
    }

    const reviewedCheckInIds = new Set(
      reviewedLogs.map(item => item.targetUserId).filter((value): value is string => Boolean(value))
    );

    const rawIssues: RawIssue[] = [];

    for (const client of clients) {
      const unread = unreadByClient.get(client.id);
      if (unread?.lastUnreadAt) {
        const unreadAge = now.getTime() - unread.lastUnreadAt.getTime();
        if (unreadAge >= ONE_HOUR_MS) {
          rawIssues.push({
            id: `critical-unread-${client.id}`,
            severity: 'critical',
            clientId: client.id,
            clientName: client.name,
            title: 'Unread message waiting over 1 hour',
            detail: `${unread.unreadCount} unread message(s) from client`,
            occurredAt: unread.lastUnreadAt.toISOString(),
            actions: createBaseActions(
              client.id,
              'I saw your message and I am responding now. Let us handle this today.'
            ),
          });
        }
      }

      const weeklyStatus = getWeeklyCheckInSeverity(Boolean(thisWeekCheckInByClient.get(client.id)));
      if (weeklyStatus === 'overdue') {
        rawIssues.push({
          id: `critical-checkin-${client.id}`,
          severity: 'critical',
          clientId: client.id,
          clientName: client.name,
          title: 'Weekly check-in overdue',
          detail: 'No check-in submitted by expected day.',
          occurredAt: now.toISOString(),
          actions: createBaseActions(
            client.id,
            'Let us get your weekly check-in done today so we can adjust your plan quickly.'
          ),
        });
      }

      const latestWorkoutAt = latestWorkoutByClient.get(client.id);
      if (!latestWorkoutAt || now.getTime() - latestWorkoutAt.getTime() >= THREE_DAYS_MS) {
        rawIssues.push({
          id: `warning-workout-${client.id}`,
          severity: 'warning',
          clientId: client.id,
          clientName: client.name,
          title: 'No workout activity for 3 days',
          detail: latestWorkoutAt
            ? `Last workout: ${latestWorkoutAt.toLocaleDateString()}`
            : 'No workout sessions logged yet.',
          occurredAt: latestWorkoutAt ? latestWorkoutAt.toISOString() : client.createdAt.toISOString(),
          actions: createBaseActions(client.id, 'I noticed training has paused. Let us restart with a short session today.'),
        });
      }

      const latestNutritionAt = latestNutritionByClient.get(client.id);
      if (!latestNutritionAt || now.getTime() - latestNutritionAt.getTime() >= TWO_DAYS_MS) {
        rawIssues.push({
          id: `warning-nutrition-${client.id}`,
          severity: 'warning',
          clientId: client.id,
          clientName: client.name,
          title: 'No meal compliance log for 2 days',
          detail: latestNutritionAt
            ? `Last nutrition log: ${latestNutritionAt.toLocaleDateString()}`
            : 'No nutrition logs submitted yet.',
          occurredAt: latestNutritionAt ? latestNutritionAt.toISOString() : client.createdAt.toISOString(),
          actions: createBaseActions(
            client.id,
            'Send me a quick nutrition update so we can keep progress on track.'
          ),
        });
      }

      const clientCheckIns = (latestCheckInsByClient.get(client.id) ?? []).filter(entry => entry.weightKg != null);
      if (client.targetWeight != null && clientCheckIns.length >= 3) {
        const distances = clientCheckIns.slice(0, 3).map(entry => Math.abs((entry.weightKg as number) - client.targetWeight!));
        if (distances[0] > distances[1] && distances[1] > distances[2]) {
          const latestCheckIn = clientCheckIns[0];
          const actions = createBaseActions(
            client.id,
            'I spotted a trend shift. We are making a small adjustment today to protect momentum.'
          );

          if (!reviewedCheckInIds.has(latestCheckIn.id)) {
            actions.unshift({
              kind: 'mark_checkin_reviewed',
              label: 'Mark Reviewed',
              clientId: client.id,
              checkInId: latestCheckIn.id,
            });
          }

          rawIssues.push({
            id: `watch-weight-${client.id}`,
            severity: 'watch',
            clientId: client.id,
            clientName: client.name,
            title: 'Weight trend is slipping',
            detail: 'Recent check-ins are moving away from target trend.',
            occurredAt: latestCheckIn.submittedAt.toISOString(),
            actions,
          });
        }
      }

      const ageMs = now.getTime() - client.createdAt.getTime();
      const onboardingSignals =
        (conversationCountByClient.get(client.id) ?? 0) +
        (workoutCountByClient.get(client.id) ?? 0) +
        (activeMealPlansByClient.get(client.id) ?? 0) +
        (videoAssignmentsByClient.get(client.id) ?? 0);

      if (ageMs >= ONE_DAY_MS && onboardingSignals === 0) {
        rawIssues.push({
          id: `warning-onboarding-${client.id}`,
          severity: 'warning',
          clientId: client.id,
          clientName: client.name,
          title: 'New client not onboarded in 24h',
          detail: 'No assignments, sessions, or conversation started yet.',
          occurredAt: client.createdAt.toISOString(),
          actions: createBaseActions(
            client.id,
            'Welcome aboard. I am setting up your first week now so you can begin immediately.'
          ),
        });
      }
    }

    rawIssues.sort((a, b) => {
      const severityDelta = ATTENTION_ORDER[a.severity] - ATTENTION_ORDER[b.severity];
      if (severityDelta !== 0) return severityDelta;
      return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
    });

    const attentionByClient = new Map<string, CommandCenterAttentionItem>();

    for (const issue of rawIssues) {
      const current = attentionByClient.get(issue.clientId);

      const issueEntry: CommandCenterIssue = {
        id: issue.id,
        severity: issue.severity,
        title: issue.title,
        detail: issue.detail,
        occurredAt: issue.occurredAt,
      };

      if (!current) {
        attentionByClient.set(issue.clientId, {
          id: `attention-${issue.clientId}`,
          severity: issue.severity,
          clientId: issue.clientId,
          clientName: issue.clientName,
          title: issue.title,
          detail: issue.detail,
          occurredAt: issue.occurredAt,
          issueCount: 1,
          issues: [issueEntry],
          actions: issue.actions,
        });
        continue;
      }

      const mergedIssues = [...current.issues, issueEntry].sort((a, b) => {
        const severityDelta = ATTENTION_ORDER[a.severity] - ATTENTION_ORDER[b.severity];
        if (severityDelta !== 0) return severityDelta;
        return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
      });

      const { title, detail } = summarizeIssues(mergedIssues);
      const mostSevere = mergedIssues[0]?.severity ?? current.severity;
      const mostRecent = [current.occurredAt, issue.occurredAt].sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      )[0];

      attentionByClient.set(issue.clientId, {
        ...current,
        severity: mostSevere,
        title,
        detail,
        occurredAt: mostRecent,
        issueCount: mergedIssues.length,
        issues: mergedIssues,
        actions: mergeActions(current.actions, issue.actions),
      });
    }

    const attentionItems = [...attentionByClient.values()].sort((a, b) => {
      const severityDelta = ATTENTION_ORDER[a.severity] - ATTENTION_ORDER[b.severity];
      if (severityDelta !== 0) return severityDelta;
      return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
    });

    const groupedAttention: CommandCenterAttentionGroup[] = [
      { severity: 'critical', label: 'Critical', items: [] },
      { severity: 'warning', label: 'Warning', items: [] },
      { severity: 'watch', label: 'Watch', items: [] },
    ];

    for (const item of attentionItems) {
      groupedAttention.find(group => group.severity === item.severity)?.items.push(item);
    }

    const todayActions: CommandCenterTodayAction[] = [];

    for (const item of attentionItems.slice(0, 8)) {
      todayActions.push({
        id: `action-${item.id}`,
        title: item.title,
        detail: item.detail,
        clientId: item.clientId,
        clientName: item.clientName,
        dueAt: item.occurredAt,
        actions: item.actions,
      });
    }

    for (const session of sessionsToday) {
      todayActions.push({
        id: `session-${session.id}`,
        title: 'Upcoming coaching session today',
        detail: `${session.type.replace('_', ' ')} • ${session.duration} min`,
        clientId: session.clientId,
        clientName: session.client?.name ?? 'Client',
        dueAt: session.date.toISOString(),
        actions: createBaseActions(
          session.clientId,
          'Reminder: we are on for your session today. Reply if you need any adjustment before we start.'
        ),
      });
    }

    const momentumMap = new Map<string, { id: string; clientId: string; clientName: string; title: string; detail: string; occurredAt: string }>();

    const recentWorkoutRows = await prisma.workout.findMany({
      where: {
        clientId: { in: clientIds },
        date: { gte: new Date(now.getTime() - ONE_DAY_MS) },
      },
      orderBy: { date: 'desc' },
      take: 20,
      select: {
        id: true,
        clientId: true,
        date: true,
        type: true,
        client: { select: { name: true } },
      },
    });

    for (const workout of recentWorkoutRows) {
      momentumMap.set(`workout-${workout.id}`, {
        id: `momentum-workout-${workout.id}`,
        clientId: workout.clientId,
        clientName: workout.client.name,
        title: 'Workout completed',
        detail: `${workout.type.replace('_', ' ')} logged today.`,
        occurredAt: workout.date.toISOString(),
      });
    }

    for (const checkIn of latestCheckIns.filter(item => now.getTime() - item.submittedAt.getTime() <= ONE_DAY_MS)) {
      const client = clientById.get(checkIn.clientId);
      if (!client) continue;
      momentumMap.set(`checkin-${checkIn.id}`, {
        id: `momentum-checkin-${checkIn.id}`,
        clientId: checkIn.clientId,
        clientName: client.name,
        title: 'Weekly check-in submitted',
        detail: 'Client submitted this week update.',
        occurredAt: checkIn.submittedAt.toISOString(),
      });
    }

    for (const nutrition of recentNutritionLogs) {
      if (nutrition.status === 'OFF_PLAN') continue;
      const client = clientById.get(nutrition.clientId);
      if (!client) continue;

      momentumMap.set(`nutrition-${nutrition.id}`, {
        id: `momentum-nutrition-${nutrition.id}`,
        clientId: nutrition.clientId,
        clientName: client.name,
        title: 'Meal compliance logged',
        detail: `Nutrition status: ${nutrition.status.toLowerCase().replace('_', ' ')}`,
        occurredAt: nutrition.dayDate.toISOString(),
      });
    }

    const momentum = [...momentumMap.values()]
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 8);

    const recentChanges: CommandCenterRecentChange[] = [];

    for (const row of unreadRows) {
      const client = clientById.get(row.clientId);
      if (!client || !row.lastUnreadAt) continue;

      recentChanges.push({
        id: `change-message-${row.conversationId}`,
        clientId: row.clientId,
        clientName: client.name,
        category: 'message',
        text: `${Number(row.unreadCount)} unread message(s) waiting.`,
        occurredAt: row.lastUnreadAt.toISOString(),
        actions: createBaseActions(row.clientId, 'I am responding now. We will resolve this today.'),
      });
    }

    for (const workout of recentWorkoutRows.slice(0, 10)) {
      recentChanges.push({
        id: `change-workout-${workout.id}`,
        clientId: workout.clientId,
        clientName: workout.client.name,
        category: 'workout',
        text: `Completed ${workout.type.toLowerCase().replace('_', ' ')} workout.`,
        occurredAt: workout.date.toISOString(),
        actions: createBaseActions(workout.clientId, 'Great work today. Keep this momentum for the next session.'),
      });
    }

    for (const checkIn of latestCheckIns.slice(0, 10)) {
      const client = clientById.get(checkIn.clientId);
      if (!client) continue;

      const actions = createBaseActions(checkIn.clientId, 'I reviewed your check-in and will tune your plan.');
      if (!reviewedCheckInIds.has(checkIn.id)) {
        actions.unshift({
          kind: 'mark_checkin_reviewed',
          label: 'Mark Reviewed',
          clientId: checkIn.clientId,
          checkInId: checkIn.id,
        });
      }

      recentChanges.push({
        id: `change-checkin-${checkIn.id}`,
        clientId: checkIn.clientId,
        clientName: client.name,
        category: 'check_in',
        text: 'Weekly check-in submitted.',
        occurredAt: checkIn.submittedAt.toISOString(),
        actions,
      });
    }

    for (const nutrition of recentNutritionLogs.slice(0, 10)) {
      const client = clientById.get(nutrition.clientId);
      if (!client) continue;

      recentChanges.push({
        id: `change-nutrition-${nutrition.id}`,
        clientId: nutrition.clientId,
        clientName: client.name,
        category: 'nutrition',
        text: `Nutrition log: ${nutrition.status.toLowerCase().replace('_', ' ')}`,
        occurredAt: nutrition.dayDate.toISOString(),
        actions: createBaseActions(nutrition.clientId, 'I saw your nutrition update. Let us keep it consistent.'),
      });
    }

    recentChanges.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

    const response: AdminCommandCenterResponse = {
      generatedAt: toIso(now),
      attention: groupedAttention,
      todayActions: todayActions
        .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
        .slice(0, 12),
      momentum,
      recentChanges: recentChanges.slice(0, 14),
      compactMetrics: {
        clientsNeedingAttention: new Set(attentionItems.map(item => item.clientId)).size,
        quickRepliesPending: unreadRows.reduce((sum, row) => sum + Number(row.unreadCount), 0),
        sessionsToday: sessionsToday.length,
      },
    };

    return jsonWithCache(response);
  } catch (error) {
    console.error('[ADMIN_COMMAND_CENTER_GET] Failed:', error);
    return jsonWithCache({ error: 'Failed to fetch command center data' }, { status: 500 });
  }
}
