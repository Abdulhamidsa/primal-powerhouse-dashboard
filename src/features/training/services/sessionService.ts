import { prisma } from '@/lib/prisma';
import { invalidateUserDashboardSummaryCaches } from '@/lib/cache-tags';
import type {
  StartTrainingSessionInput,
  CompleteTrainingSessionInput,
  UpdateSetInput,
} from '../schemas/session.schemas';
import type { TrainingSessionWithExercises } from '../types/index';

/**
 * Training Session Service
 * Handles workout session creation (with snapshot logic), execution, and completion
 * CRITICAL: Sessions are immutable history records
 */

export const trainingSessionService = {
  /**
   * Start a new workout session
   * Creates an IMMUTABLE snapshot from the template
   *
   * Key behavior:
   * 1. Abandons any existing IN_PROGRESS sessions for this client
   * 2. Snapshots template exercises into session exercises
   * 3. Creates blank session sets for tracking
   * 4. Updates plan day status to PENDING (if not already started)
   */
  async startSession(clientId: string, input: StartTrainingSessionInput): Promise<TrainingSessionWithExercises> {
    // Get plan day with template
    const planDay = await prisma.trainingPlanDay.findUnique({
      where: { id: input.planDayId },
      include: {
        plan: true,
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

    if (!planDay) {
      throw new Error('Plan day not found');
    }

    // Verify this plan belongs to the client
    if (planDay.plan.clientId !== clientId) {
      throw new Error('Unauthorized');
    }

    if (planDay.status === 'COMPLETED') {
      throw new Error('This workout day is already completed');
    }

    const todayKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Copenhagen',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const planDayKey = planDay.date.toISOString().slice(0, 10);
    if (planDayKey > todayKey) {
      throw new Error('This workout is not available yet');
    }

    // If it's a REST day or no template, cannot start
    if (planDay.type === 'REST' || !planDay.workoutTemplate) {
      throw new Error('Cannot start a session for a rest day');
    }

    const template = planDay.workoutTemplate;

    const result = await (prisma as any).$transaction(async (tx: any) => {
      const existingSession = await tx.trainingSession.findFirst({
        where: { planDayId: input.planDayId, clientId, status: 'IN_PROGRESS' },
        include: {
          exercises: {
            include: { sets: { orderBy: { setNumber: 'asc' } }, exercise: true },
            orderBy: { order: 'asc' },
          },
          planDay: {
            include: {
              workoutTemplate: {
                include: { exercises: { include: { exercise: true }, orderBy: { order: 'asc' } } },
              },
            },
          },
        },
      });

      if (existingSession) return existingSession;

      // 1. Abandon any existing IN_PROGRESS sessions for this client
      await tx.trainingSession.updateMany({
        where: {
          clientId,
          status: 'IN_PROGRESS',
        },
        data: {
          status: 'ABANDONED',
        },
      });

      // 2. Create new session
      const session = await tx.trainingSession.create({
        data: {
          planDayId: input.planDayId,
          clientId,
          coachId: planDay.plan.coachId,
          workoutTemplateId: template.id,
          status: 'IN_PROGRESS',
        },
      });

      // 3. Snapshot template exercises into session exercises + sets
      for (const templateEx of template.exercises) {
        const exercise = templateEx.exercise;

        // Create session exercise (immutable snapshot)
        const sessionExercise = await tx.trainingSessionExercise.create({
          data: {
            sessionId: session.id,
            exerciseId: exercise.id,
            order: templateEx.order,
            exerciseNameSnapshot: exercise.name,
            muscleGroupSnapshot: exercise.muscleGroup,
            equipmentSnapshot: exercise.equipment,
            notesSnapshot: templateEx.notes,
            plannedSets: templateEx.sets,
            plannedReps: templateEx.reps,
            plannedRestSeconds: templateEx.restSeconds,
            targetRpeSnapshot: templateEx.targetRpe,
            targetTempoSnapshot: templateEx.targetTempo,
          },
        });

        // Create blank session sets for each set in the exercise
        for (let setNum = 1; setNum <= templateEx.sets; setNum++) {
          await tx.trainingSessionSet.create({
            data: {
              sessionExerciseId: sessionExercise.id,
              setNumber: setNum,
              plannedReps: templateEx.reps,
              plannedWeightKg: exercise.defaultSets ? exercise.defaultSets : null,
              plannedRestSeconds: templateEx.restSeconds,
              completed: false,
              skipped: false,
            },
          });
        }
      }

      // 4. Return full session with exercises and sets
      return tx.trainingSession.findUnique({
        where: { id: session.id },
        include: {
          exercises: {
            include: {
              sets: { orderBy: { setNumber: 'asc' } },
              exercise: true,
            },
            orderBy: { order: 'asc' },
          },
          planDay: {
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
          },
        },
      });
    });

    invalidateUserDashboardSummaryCaches({ clientId });
    return result;
  },

  /**
   * Get a session (for client during workout or coach reviewing)
   */
  async getSession(sessionId: string, clientId: string): Promise<TrainingSessionWithExercises | null> {
    return (prisma as any).trainingSession.findFirst({
      where: {
        id: sessionId,
        clientId,
      },
      include: {
        exercises: {
          include: {
            sets: { orderBy: { setNumber: 'asc' } },
            exercise: true,
          },
          orderBy: { order: 'asc' },
        },
        planDay: {
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
        },
      },
    });
  },

  /**
   * Update a set during workout
   */
  async updateSet(sessionId: string, clientId: string, setId: string, input: UpdateSetInput) {
    // Verify session belongs to client
    const session = await this.getSession(sessionId, clientId);
    if (!session) {
      throw new Error('Session not found or unauthorized');
    }

    // Verify session is still IN_PROGRESS
    if (session.status !== 'IN_PROGRESS') {
      throw new Error('Session is not in progress');
    }

    if (!session.exercises.some(exercise => exercise.sets.some(set => set.id === setId))) {
      throw new Error('Set not found in this session');
    }

    return prisma.trainingSessionSet.update({
      where: { id: setId },
      data: input,
    });
  },

  /**
   * Complete a session
   * Marks session as COMPLETED/ABANDONED and updates plan day status
   */
  async completeSession(sessionId: string, clientId: string, input: CompleteTrainingSessionInput) {
    // Verify session belongs to client
    const session = await this.getSession(sessionId, clientId);
    if (!session) {
      throw new Error('Session not found or unauthorized');
    }

    const updatedSession = await (prisma as any).$transaction(async (tx: any) => {
      await tx.trainingSession.update({
        where: { id: sessionId },
        data: {
          status: input.status,
          completedAt: input.status === 'COMPLETED' ? new Date() : null,
          perceivedDifficulty: input.perceivedDifficulty,
          overallFeedback: input.overallFeedback,
          caloriesBurned: input.caloriesBurned,
        },
      });

      // Update plan day status if session completed
      if (input.status === 'COMPLETED') {
        await tx.trainingPlanDay.update({
          where: { id: session.planDay.id },
          data: { status: 'COMPLETED' },
        });
      }

      // Return updated session
      return tx.trainingSession.findUnique({
        where: { id: sessionId },
        include: {
          exercises: {
            include: {
              sets: { orderBy: { setNumber: 'asc' } },
              exercise: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      });
    });

    invalidateUserDashboardSummaryCaches({ clientId });
    return updatedSession;

  },

  /**
   * Get previous performance for an exercise
   * Returns the last completed set data for this exercise
   */
  async getPreviousPerformance(exerciseId: string, clientId: string) {
    // Find the most recent completed session with this exercise
    const lastSession = await prisma.trainingSessionExercise.findFirst({
      where: {
        exerciseId,
        session: {
          clientId,
          status: 'COMPLETED',
        },
      },
      include: {
        sets: {
          where: { completed: true },
          orderBy: { setNumber: 'asc' },
        },
        exercise: true,
      },
      orderBy: {
        session: { completedAt: 'desc' },
      },
    });

    if (!lastSession || !lastSession.sets.length) {
      return null;
    }

    return {
      exerciseName: lastSession.exerciseNameSnapshot,
      sets: lastSession.sets.map(s => ({
        setNumber: s.setNumber,
        reps: s.actualReps,
        weight: s.actualWeightKg,
        feedback: s.feedback,
      })),
    };
  },

  /**
   * Skip a plan day (mark as SKIPPED)
   */
  async skipPlanDay(planDayId: string, clientId: string) {
    const planDay = await prisma.trainingPlanDay.findFirst({
      where: {
        id: planDayId,
        plan: { clientId },
      },
    });

    if (!planDay) {
      throw new Error('Plan day not found');
    }

    const skipped = await prisma.trainingPlanDay.update({
      where: { id: planDayId },
      data: { status: 'SKIPPED' },
    });

    invalidateUserDashboardSummaryCaches({ clientId });
    return skipped;
  },

  /**
   * Get client's completed sessions (for history)
   */
  async getClientHistory(clientId: string, limit = 10) {
    return prisma.trainingSession.findMany({
      where: {
        clientId,
        status: 'COMPLETED',
      },
      include: {
        exercises: {
          include: {
            sets: { orderBy: { setNumber: 'asc' } },
            exercise: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });
  },
};
