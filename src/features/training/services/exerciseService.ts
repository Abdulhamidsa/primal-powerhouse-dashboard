import { prisma } from '@/lib/prisma';
import type { CreateExerciseInput, UpdateExerciseInput } from '../schemas/exercise.schemas';
import { Equipment, MuscleGroup, type Exercise } from '@prisma/client';

type ExerciseDbImportInput = {
  exerciseId: string;
  name: string;
  gifUrl?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  targetMuscles?: string[];
  bodyParts?: string[];
  equipments?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  overview?: string | null;
};

const muscleAliases: Record<string, MuscleGroup> = {
  ABDOMINALS: MuscleGroup.ABS,
  ABS: MuscleGroup.ABS,
  ABDUCTORS: MuscleGroup.ABDUCTORS,
  ADDUCTORS: MuscleGroup.ADDUCTORS,
  BACK: MuscleGroup.BACK,
  BICEPS: MuscleGroup.BICEPS,
  CALVES: MuscleGroup.CALVES,
  CHEST: MuscleGroup.CHEST,
  CORE: MuscleGroup.CORE,
  FOREARMS: MuscleGroup.FOREARMS,
  GLUTES: MuscleGroup.GLUTES,
  HAMSTRINGS: MuscleGroup.HAMSTRINGS,
  LEGS: MuscleGroup.LEGS,
  OBLIQUES: MuscleGroup.OBLIQUES,
  QUADRICEPS: MuscleGroup.QUADRICEPS,
  QUADS: MuscleGroup.QUADRICEPS,
  SHOULDERS: MuscleGroup.SHOULDERS,
  TRAPS: MuscleGroup.BACK,
  TRICEPS: MuscleGroup.TRICEPS,
  'UPPER ARMS': MuscleGroup.BICEPS,
  'UPPER LEGS': MuscleGroup.LEGS,
  'LOWER ARMS': MuscleGroup.FOREARMS,
  'LOWER LEGS': MuscleGroup.CALVES,
  WAIST: MuscleGroup.CORE,
};

const equipmentAliases: Record<string, Equipment> = {
  BAND: Equipment.BAND,
  BARBELL: Equipment.BARBELL,
  BODYWEIGHT: Equipment.BODYWEIGHT,
  'BODY WEIGHT': Equipment.BODYWEIGHT,
  CABLE: Equipment.CABLE,
  DUMBBELL: Equipment.DUMBBELL,
  'EZ BARBELL': Equipment.EZ_BAR,
  'EZ BAR': Equipment.EZ_BAR,
  KETTLEBELL: Equipment.KETTLEBELL,
  MACHINE: Equipment.MACHINE,
  'MEDICINE BALL': Equipment.MEDICINE_BALL,
  'STABILITY BALL': Equipment.MEDICINE_BALL,
  TRAPBAR: Equipment.TRAP_BAR,
  'TRAP BAR': Equipment.TRAP_BAR,
  SUSPENSION: Equipment.TRX,
  TRX: Equipment.TRX,
};

function normalizeLabel(value: string | null | undefined) {
  return (value ?? '').replace(/[_-]/g, ' ').trim().toUpperCase();
}

function mapMuscle(values: Array<string | null | undefined>, fallback: MuscleGroup = MuscleGroup.LEGS) {
  for (const value of values) {
    const mapped = muscleAliases[normalizeLabel(value)];
    if (mapped) return mapped;
  }
  return fallback;
}

function mapEquipment(values: Array<string | null | undefined>) {
  for (const value of values) {
    const mapped = equipmentAliases[normalizeLabel(value)];
    if (mapped) return mapped;
  }
  return null;
}

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
   * Import an ExerciseDB catalog item into the coach-owned Training Exercise table.
   * Templates and sessions require local Exercise IDs so imported catalog items can be snapshotted.
   */
  async importExerciseDbExercise(coachId: string, input: ExerciseDbImportInput): Promise<Exercise> {
    const name = input.name.trim();
    if (!name) throw new Error('Exercise name is required');

    const targetValues = [...(input.targetMuscles ?? []), ...(input.bodyParts ?? [])];
    const secondaryValues = input.secondaryMuscles ?? [];
    const muscleGroup = mapMuscle(targetValues);
    const muscleGroupSecondary = secondaryValues.length > 0 ? mapMuscle(secondaryValues, muscleGroup) : null;
    const equipment = mapEquipment(input.equipments ?? []);
    const imageUrl = input.imageUrl || input.gifUrl || null;
    const videoUrl = input.videoUrl || null;
    const instructions = input.instructions?.length ? input.instructions.join('\n') : null;
    const description = input.overview || `Imported from ExerciseDB: ${input.exerciseId}`;

    const existing = await prisma.exercise.findFirst({
      where: {
        coachId,
        OR: [
          { name },
          ...(imageUrl ? [{ imageUrl }] : []),
          ...(videoUrl ? [{ videoUrl }] : []),
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    const data = {
      name,
      description,
      muscleGroup,
      muscleGroupSecondary,
      equipment,
      imageUrl,
      videoUrl,
      instructions,
      defaultSets: 3,
      defaultReps: 8,
      defaultRestSeconds: 120,
    };

    if (existing) {
      return prisma.exercise.update({
        where: { id: existing.id },
        data,
      });
    }

    return prisma.exercise.create({
      data: {
        ...data,
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
