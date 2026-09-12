import { prisma } from '@/lib/prisma';
import { invalidateUserDashboardSummaryCaches } from '@/lib/cache-tags';
import type { CreateClientTrainingPlanInput, UpdateClientTrainingPlanInput } from '../schemas/plan.schemas';
// import type { ClientTrainingPlanWithDays } from '../types/index';

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
          orderBy: { date: 'asc' },
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
          orderBy: { date: 'asc' },
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
          orderBy: { date: 'asc' },
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
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!plan) return null;

    return {
      ...plan,
      days: plan.days.map(({ sessions, ...day }) => ({
        ...day,
        latestSession: sessions[0] ?? null,
      })),
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
          orderBy: { date: 'asc' },
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
          orderBy: { date: 'asc' },
        },
      },
    });
  },
};
