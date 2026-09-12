import { prisma } from '@/lib/prisma';
import { invalidateUserDashboardSummaryCaches } from '@/lib/cache-tags';
import type {
  CreateTrainingPlanDayInput,
  UpdateTrainingPlanDayInput,
  BulkCreateTrainingPlanDaysInput,
} from '../schemas/day.schemas';

/**
 * Training Plan Day Service
 * Handles CRUD for individual day entries in a plan
 */

export const trainingPlanDayService = {
  /**
   * Create a single plan day (with unique constraint enforcement)
   */
  async createPlanDay(coachId: string, input: CreateTrainingPlanDayInput) {
    // Verify coach owns the plan
    const plan = await prisma.clientTrainingPlan.findFirst({
      where: {
        id: input.planId,
        coachId,
      },
    });

    if (!plan) {
      throw new Error('Plan not found or unauthorized');
    }

    // Check if day already exists for this date
    const existingDay = await prisma.trainingPlanDay.findUnique({
      where: {
        planId_date: {
          planId: input.planId,
          date: input.date,
        },
      },
    });

    if (existingDay) {
      throw new Error('A day entry already exists for this date in this plan');
    }

    // Validate template exists if type is WORKOUT
    if (input.type === 'WORKOUT' && input.workoutTemplateId) {
      const template = await prisma.workoutTemplate.findFirst({
        where: {
          id: input.workoutTemplateId,
          coachId, // Ensure coach owns this template
        },
      });

      if (!template) {
        throw new Error('Workout template not found or unauthorized');
      }
    }

    const created = await prisma.trainingPlanDay.create({
      data: {
        planId: input.planId,
        date: input.date,
        type: input.type,
        workoutTemplateId: input.workoutTemplateId ?? null,
        title: input.title ?? null,
        note: input.note ?? null,
        status: 'PENDING',
      },
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
    });
    invalidateUserDashboardSummaryCaches({ clientId: plan.clientId });
    return created;
  },

  /**
   * Bulk create plan days (for calendar/week layouts)
   */
  async bulkCreatePlanDays(coachId: string, input: BulkCreateTrainingPlanDaysInput) {
    // Verify coach owns the plan
    const plan = await prisma.clientTrainingPlan.findFirst({
      where: {
        id: input.planId,
        coachId,
      },
    });

    if (!plan) {
      throw new Error('Plan not found or unauthorized');
    }

    const created = await (prisma as any).$transaction(async (tx: any) => {
      const created = [];

      for (const day of input.days) {
        // Check if day already exists
        const existing = await tx.trainingPlanDay.findUnique({
          where: {
            planId_date: {
              planId: input.planId,
              date: day.date,
            },
          },
        });

        if (existing) {
          continue; // Skip if already exists
        }

        // Validate template if provided
        if (day.type === 'WORKOUT' && day.workoutTemplateId) {
          const template = await tx.workoutTemplate.findFirst({
            where: {
              id: day.workoutTemplateId,
              coachId,
            },
          });

          if (!template) {
            throw new Error(`Template not found: ${day.workoutTemplateId}`);
          }
        }

        const planDay = await tx.trainingPlanDay.create({
          data: {
            planId: input.planId,
            date: day.date,
            type: day.type,
            workoutTemplateId: day.workoutTemplateId ?? null,
            status: 'PENDING',
          },
        });

        created.push(planDay);
      }

      return created;
    });
    invalidateUserDashboardSummaryCaches({ clientId: plan.clientId });
    return created;
  },

  /**
   * Get a plan day
   */
  async getPlanDay(dayId: string, coachId: string) {
    return prisma.trainingPlanDay.findFirst({
      where: {
        id: dayId,
        plan: { coachId },
      },
      include: {
        plan: { select: { clientId: true } },
        workoutTemplate: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  },

  /**
   * Get plan day by date (for client)
   */
  async getClientPlanDayByDate(planId: string, clientId: string, date: Date) {
    return prisma.trainingPlanDay.findFirst({
      where: {
        planId,
        date: {
          gte: new Date(date.toDateString()),
          lt: new Date(new Date(date.toDateString()).getTime() + 86400000), // Next day
        },
        plan: { clientId },
      },
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
    });
  },

  /**
   * Update a plan day
   */
  async updatePlanDay(dayId: string, coachId: string, input: UpdateTrainingPlanDayInput) {
    // Verify coach owns the plan
    const day = await this.getPlanDay(dayId, coachId);
    if (!day) {
      throw new Error('Plan day not found or unauthorized');
    }

    const updated = await prisma.trainingPlanDay.update({
      where: { id: dayId },
      data: input,
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
    });
    invalidateUserDashboardSummaryCaches({ clientId: day.plan.clientId });
    return updated;
  },

  /**
   * Delete a plan day (soft delete via status if sessions exist)
   */
  async deletePlanDay(dayId: string, coachId: string) {
    // Verify coach owns the plan
    const day = await this.getPlanDay(dayId, coachId);
    if (!day) {
      throw new Error('Plan day not found or unauthorized');
    }

    // Check if any sessions exist
    const sessionCount = await prisma.trainingSession.count({
      where: { planDayId: dayId },
    });

    if (sessionCount > 0) {
      throw new Error('Cannot delete plan day: sessions have been recorded');
    }

    await prisma.trainingPlanDay.delete({
      where: { id: dayId },
    });
    invalidateUserDashboardSummaryCaches({ clientId: day.plan.clientId });

    return true;
  },
};
