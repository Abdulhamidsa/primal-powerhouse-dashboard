import { prisma } from '@/lib/prisma';
import { invalidateUserDashboardSummaryCaches } from '@/lib/cache-tags';
import type { CreateClientTrainingPlanInput, UpdateClientTrainingPlanInput } from '../schemas/plan.schemas';
// import type { ClientTrainingPlanWithDays } from '../types/index';

function getCopenhagenDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Copenhagen',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function dateKeyToNoon(dateKey: string) {
  return new Date(`${dateKey}T12:00:00.000Z`);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function startOfIsoWeek(dateKey: string) {
  const date = dateKeyToNoon(dateKey);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addDays(date, mondayOffset);
}

function dayBounds(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = addDays(start, 1);
  return { start, end };
}

function isInsidePlanWindow(plan: { startDate: Date; endDate: Date | null }, date: Date) {
  const { start } = dayBounds(date);
  const planStart = dayBounds(plan.startDate).start;
  const planEnd = plan.endDate ? dayBounds(plan.endDate).start : null;
  return start >= planStart && (!planEnd || start <= planEnd);
}

/**
 * Training Plan Service
 * Handles CRUD operations for client training plans
 */

export const trainingPlanService = {
  /**
   * Create a new training plan for a client
   */
  async createPlan(coachId: string, input: CreateClientTrainingPlanInput) {
    // Verify the coach owns this client
    const client = await prisma.client.findFirst({
      where: {
        id: input.clientId,
        coachId,
      },
    });

    if (!client) {
      throw new Error('Client not found or unauthorized');
    }

    const created = await (prisma as any).clientTrainingPlan.create({
      data: {
        clientId: input.clientId,
        coachId,
        name: input.name,
        description: input.description ?? null,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        status: input.status ?? 'ACTIVE',
      },
      include: {
        days: {
          where: { weekday: { not: null } },
          include: {
            sessions: {
              select: { id: true, status: true, completedAt: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            workoutTemplate: {
              include: {
                exercises: {
                  include: { exercise: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
          orderBy: [{ weekday: 'asc' }, { date: 'asc' }],
        },
        client: {
          select: { id: true, name: true },
        },
      },
    });
    invalidateUserDashboardSummaryCaches({ clientId: input.clientId });
    return created;
  },

  /**
   * Get all plans for a coach (with optional client filter)
   */
  async getCoachPlans(coachId: string, clientId?: string) {
    const where: any = { coachId };
    if (clientId) {
      where.clientId = clientId;
    }

    return prisma.clientTrainingPlan.findMany({
      where,
      include: {
        days: {
          where: { weekday: { not: null } },
          include: {
            workoutTemplate: {
              include: {
                exercises: {
                  include: { exercise: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
          orderBy: [{ weekday: 'asc' }, { date: 'asc' }],
        },
        client: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get a single plan (with authorization check)
   */
  async getPlan(planId: string, coachId: string) {
    return (prisma as any).clientTrainingPlan.findFirst({
      where: {
        id: planId,
        coachId,
      },
      include: {
        days: {
          where: { weekday: { not: null } },
          include: {
            workoutTemplate: {
              include: {
                exercises: {
                  include: { exercise: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
          orderBy: [{ weekday: 'asc' }, { date: 'asc' }],
        },
        client: {
          select: { id: true, name: true },
        },
      },
    });
  },

  /**
   * Get active plan for a client
   */
  async getClientActivePlan(clientId: string) {
    const plan = await prisma.clientTrainingPlan.findFirst({
      where: {
        clientId,
        status: 'ACTIVE',
      },
      orderBy: { startDate: 'desc' },
      include: {
        days: {
          where: { weekday: { not: null } },
          include: {
            sessions: {
              select: { id: true, status: true, completedAt: true, startedAt: true },
              orderBy: { createdAt: 'desc' },
            },
            workoutTemplate: {
              include: {
                exercises: {
                  include: { exercise: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
          orderBy: [{ weekday: 'asc' }, { date: 'asc' }],
        },
        client: {
          select: { id: true, name: true },
        },
      },
    });

    if (!plan) return null;

    const todayKey = getCopenhagenDateKey();
    const monday = startOfIsoWeek(todayKey);
    const generatedDays = Array.from({ length: 7 }, (_, index) => {
      const currentDate = addDays(monday, index);
      const patternDay = plan.days.find(day => day.weekday === index);
      if (!patternDay || !isInsidePlanWindow(plan, currentDate)) return null;

      const { start, end } = dayBounds(currentDate);
      const latestSession = patternDay.sessions.find(session => session.startedAt >= start && session.startedAt < end) ?? null;
      const { sessions, ...day } = patternDay;

      return {
        ...day,
        date: currentDate,
        status: latestSession?.status === 'COMPLETED' ? 'COMPLETED' : day.status,
        latestSession,
      };
    }).filter((day): day is NonNullable<typeof day> => day !== null);

    return {
      ...plan,
      days: generatedDays,
    };
  },

  /**
   * Update plan metadata
   */
  async updatePlan(planId: string, coachId: string, input: UpdateClientTrainingPlanInput) {
    // Verify ownership
    const plan = await this.getPlan(planId, coachId);
    if (!plan) {
      throw new Error('Plan not found or unauthorized');
    }

    const updated = await (prisma as any).clientTrainingPlan.update({
      where: { id: planId },
      data: input,
      include: {
        days: {
          where: { weekday: { not: null } },
          include: {
            workoutTemplate: {
              include: {
                exercises: {
                  include: { exercise: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
          orderBy: [{ weekday: 'asc' }, { date: 'asc' }],
        },
        client: {
          select: { id: true, name: true },
        },
      },
    });
    invalidateUserDashboardSummaryCaches({ clientId: plan.clientId });
    return updated;
  },

  /**
   * Get plan by ID for client (no coach authorization)
   * Used by client to read their own plan
   */
  async getClientPlan(planId: string, clientId: string) {
    return prisma.clientTrainingPlan.findFirst({
      where: {
        id: planId,
        clientId,
      },
      include: {
        days: {
          where: { weekday: { not: null } },
          include: {
            workoutTemplate: {
              include: {
                exercises: {
                  include: { exercise: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
          orderBy: [{ weekday: 'asc' }, { date: 'asc' }],
        },
      },
    });
  },
};
