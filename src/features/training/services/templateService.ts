import { prisma } from '@/lib/prisma';
import type {
  CreateWorkoutTemplateInput,
  UpdateWorkoutTemplateInput,
  TemplateExerciseInput,
} from '../schemas/template.schemas';
import type { WorkoutTemplateWithExercises } from '../types/index';

/**
 * Workout Template Service
 * Handles CRUD operations for workout templates (blueprints)
 */

export const workoutTemplateService = {
  /**
   * Create a new workout template with exercises
   */
  async createTemplate(
    coachId: string,
    input: CreateWorkoutTemplateInput
  ): Promise<WorkoutTemplateWithExercises> {
    const { exercises, ...templateData } = input;

    return (prisma as any).$transaction(async (tx: any) => {
      // Create template
      const template = await tx.workoutTemplate.create({
        data: {
          ...templateData,
          coachId,
        },
      });

      // Create exercises in template
      for (const ex of exercises) {
        await tx.workoutTemplateExercise.create({
          data: {
            workoutTemplateId: template.id,
            exerciseId: ex.exerciseId,
            order: ex.order,
            sets: ex.sets ?? 3,
            reps: ex.reps ?? 8,
            restSeconds: ex.restSeconds ?? 120,
            targetRpe: ex.targetRpe ?? null,
            targetTempo: ex.targetTempo ?? null,
            notes: ex.notes ?? null,
          },
        });
      }

      // Fetch with exercises
      return tx.workoutTemplate.findUnique({
        where: { id: template.id },
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' },
          },
          coach: {
            select: { id: true, name: true },
          },
        },
      });
    });
  },

  /**
   * Get all templates for a coach
   */
  async getCoachTemplates(coachId: string) {
    return prisma.workoutTemplate.findMany({
      where: { coachId },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get a single template with full details
   */
  async getTemplate(templateId: string, coachId: string): Promise<WorkoutTemplateWithExercises | null> {
    return prisma.workoutTemplate.findFirst({
      where: {
        id: templateId,
        coachId, // Ensure coach owns this
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
        coach: {
          select: { id: true, name: true },
        },
      },
    });
  },

  /**
   * Update a template (name, description, goal, difficulty)
   * Note: Use separate method to update exercises
   */
  async updateTemplate(
    templateId: string,
    coachId: string,
    input: UpdateWorkoutTemplateInput
  ) {
    // Verify ownership
    const template = await this.getTemplate(templateId, coachId);
    if (!template) {
      throw new Error('Template not found or unauthorized');
    }

    const { exercises, ...templateData } = input;

    return (prisma as any).$transaction(async (tx: any) => {
      // Update template metadata
      await tx.workoutTemplate.update({
        where: { id: templateId },
        data: templateData,
      });

      // If exercises provided, replace them
      if (exercises) {
        // Delete old exercises
        await tx.workoutTemplateExercise.deleteMany({
          where: { workoutTemplateId: templateId },
        });

        // Create new exercises
        for (const ex of exercises) {
          await tx.workoutTemplateExercise.create({
            data: {
              workoutTemplateId: templateId,
              exerciseId: ex.exerciseId,
              order: ex.order,
              sets: ex.sets ?? 3,
              reps: ex.reps ?? 8,
              restSeconds: ex.restSeconds ?? 120,
              targetRpe: ex.targetRpe ?? null,
              targetTempo: ex.targetTempo ?? null,
              notes: ex.notes ?? null,
            },
          });
        }
      }

      // Return updated template
      return tx.workoutTemplate.findUnique({
        where: { id: templateId },
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' },
          },
        },
      });
    });
  },

  /**
   * Delete a template (only if no plan days reference it)
   */
  async deleteTemplate(templateId: string, coachId: string): Promise<boolean> {
    // Verify ownership
    const template = await this.getTemplate(templateId, coachId);
    if (!template) {
      throw new Error('Template not found or unauthorized');
    }

    // Check if any plan days reference this template
    const planDayCount = await prisma.trainingPlanDay.count({
      where: { workoutTemplateId: templateId },
    });

    if (planDayCount > 0) {
      throw new Error('Cannot delete template: it is assigned to plan days');
    }

    await prisma.workoutTemplate.delete({
      where: { id: templateId },
    });

    return true;
  },

  /**
   * Get template by ID without authorization check (internal use)
   */
  async getTemplateForSession(templateId: string) {
    return prisma.workoutTemplate.findUnique({
      where: { id: templateId },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  },
};
