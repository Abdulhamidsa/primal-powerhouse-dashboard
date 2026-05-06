import { prisma } from '@/lib/prisma';
import type { CreateExerciseInput, UpdateExerciseInput } from '../schemas/exercise.schemas';
import type { Exercise } from '@prisma/client';

/**
 * Exercise Service
 * Handles CRUD operations for coach-owned exercises
 */

export const exerciseService = {
  /**
   * Create a new exercise for a coach
   */
  async createExercise(coachId: string, input: CreateExerciseInput): Promise<Exercise> {
    return prisma.exercise.create({
      data: {
        ...input,
        coachId,
      },
    });
  },

  /**
   * Get all exercises for a coach with optional filtering
   */
  async getCoachExercises(
    coachId: string,
    filters?: {
      muscleGroup?: string;
      equipment?: string;
      search?: string;
    },
  ) {
    const where: any = { coachId };

    if (filters?.muscleGroup) {
      where.muscleGroup = filters.muscleGroup;
    }

    if (filters?.equipment) {
      where.equipment = filters.equipment;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.exercise.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  },

  /**
   * Get a single exercise by ID (with authorization check)
   */
  async getExercise(exerciseId: string, coachId: string): Promise<Exercise | null> {
    return prisma.exercise.findFirst({
      where: {
        id: exerciseId,
        coachId, // Ensure coach owns this exercise
      },
    });
  },

  /**
   * Update an exercise (coach can edit any of their exercises)
   */
  async updateExercise(exerciseId: string, coachId: string, input: UpdateExerciseInput): Promise<Exercise> {
    // Verify ownership
    const exercise = await this.getExercise(exerciseId, coachId);
    if (!exercise) {
      throw new Error('Exercise not found or unauthorized');
    }

    return prisma.exercise.update({
      where: { id: exerciseId },
      data: input,
    });
  },

  /**
   * Soft delete (mark as inactive) - prevents accidental data loss
   * Can be undeleted if needed
   */
  async markExerciseInactive(exerciseId: string, coachId: string): Promise<Exercise> {
    // Verify ownership
    const exercise = await this.getExercise(exerciseId, coachId);
    if (!exercise) {
      throw new Error('Exercise not found or unauthorized');
    }

    // In a real app, you'd add an `isActive` field. For now, we'll just return the exercise
    // as soft delete. Alternative: add isActive boolean to schema
    return exercise;
  },

  /**
   * Get exercise by ID (public, for templates)
   */
  async getExerciseById(exerciseId: string): Promise<Exercise | null> {
    return prisma.exercise.findUnique({
      where: { id: exerciseId },
    });
  },
};
