import { z } from 'zod';

const DEFICIT_CAP_RATIO = 0.25;
const SURPLUS_CAP_RATIO = 0.15;
const FAT_FLOOR_PER_KG = 0.6;
const KCAL_PER_KG = 7700;

type GoalType =
  | 'fat_loss'
  | 'aggressive_cut'
  | 'recomposition'
  | 'lean_bulk'
  | 'maintenance'
  | 'lose_fat'
  | 'maintain'
  | 'gain_muscle'
  | string;

type FormulaPreference = 'auto' | 'mifflin' | 'katch';

const activitySchema = z.enum([
  'LOW',
  'MODERATE',
  'HIGH',
  'SEDENTARY',
  'LIGHT',
  'VERY_ACTIVE',
  'ATHLETE',
  'sedentary',
  'light',
  'moderate',
  'very_active',
  'athlete',
]);

function normalizeActivityLevel(level: string): 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE' | 'ATHLETE' {
  const key = level.trim().toUpperCase();
  if (key === 'LOW' || key === 'SEDENTARY') return 'SEDENTARY';
  if (key === 'LIGHT') return 'LIGHT';
  if (key === 'MODERATE') return 'MODERATE';
  if (key === 'HIGH' || key === 'VERY_ACTIVE') return 'VERY_ACTIVE';
  if (key === 'ATHLETE') return 'ATHLETE';
  return 'MODERATE';
}

// Activity level multipliers.
export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  VERY_ACTIVE: 1.725,
  ATHLETE: 1.9,
  LOW: 1.2,
  HIGH: 1.725,
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9,
};

// Zod validation schema.
export const HealthMetricsSchema = z.object({
  weightKg: z.coerce.number().min(30, 'Weight must be at least 30kg').max(250, 'Weight cannot exceed 250kg'),
  heightCm: z.coerce.number().min(120, 'Height must be at least 120cm').max(230, 'Height cannot exceed 230cm'),
  age: z.coerce.number().min(10, 'Age must be at least 10').max(100, 'Age cannot exceed 100'),
  gender: z.enum(['male', 'female']).catch('male'),
  activityLevel: activitySchema.catch('MODERATE'),
  goal: z
    .enum([
      'fat_loss',
      'aggressive_cut',
      'recomposition',
      'lean_bulk',
      'maintenance',
      'lose_fat',
      'maintain',
      'gain_muscle',
    ])
    .default('fat_loss'),
  weeklyRatePercent: z.coerce.number().min(0.1).max(1.2).optional(),
  bodyFatPercentage: z.coerce.number().min(3).max(60).optional(),
  formulaPreference: z.enum(['auto', 'mifflin', 'katch']).default('auto'),
});

export type HealthMetricsInput = z.infer<typeof HealthMetricsSchema>;

export interface HealthMetricsOutput {
  bmi: number;
  bmr: number;
  tdee: number;
  recommendedCalories: number;
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese';
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  notes: string[];
  isSafeToDeficit: boolean;
  calculationDetails: {
    formulaUsed: 'mifflin' | 'katch';
    activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE' | 'ATHLETE';
    activityMultiplier: number;
    goal: GoalType;
    goalAdjustmentCalories: number;
    proteinPerKg: number;
    fatFloorGrams: number;
  };
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

export function getBMICategory(bmi: number): 'underweight' | 'normal' | 'overweight' | 'obese' {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

export function calculateBMR(weightKg: number, heightCm: number, age: number, gender: 'male' | 'female'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === 'male' ? base + 5 : base - 161;
  return Math.round(bmr);
}

export function calculateBMRKatch(weightKg: number, bodyFatPercentage: number): number {
  const leanMassKg = weightKg * (1 - bodyFatPercentage / 100);
  return Math.round(370 + 21.6 * leanMassKg);
}

export function calculateTDEE(bmr: number, activityLevel: string): number {
  const normalized = normalizeActivityLevel(activityLevel);
  const multiplier = ACTIVITY_MULTIPLIERS[normalized] || 1.55;
  return Math.round(bmr * multiplier);
}

function getGoalAdjustmentCalories(input: {
  goal: GoalType;
  tdee: number;
  weightKg: number;
  weeklyRatePercent?: number;
  bmi: number;
  goalAggressiveness?: string;
  isLegacyMode?: boolean;
}): { adjustment: number; notes: string[] } {
  const notes: string[] = [];

  if (input.isLegacyMode) {
    if (
      input.bmi < 18.5 &&
      (input.goal === 'lose_fat' || input.goal === 'fat_loss' || input.goal === 'aggressive_cut')
    ) {
      notes.push('Safety override: BMI indicates underweight range, deficit disabled.');
      return { adjustment: 0, notes };
    }

    if (input.goal === 'lose_fat') {
      const deficits: Record<string, number> = { conservative: -300, standard: -400, aggressive: -500 };
      const adjustment = deficits[input.goalAggressiveness ?? 'standard'] ?? -400;
      return { adjustment, notes };
    }

    if (input.goal === 'gain_muscle') {
      const surpluses: Record<string, number> = { conservative: 200, standard: 250, aggressive: 300 };
      const adjustment = surpluses[input.goalAggressiveness ?? 'standard'] ?? 250;
      return { adjustment, notes };
    }

    return { adjustment: 0, notes };
  }

  if (input.bmi < 18.5 && (input.goal === 'fat_loss' || input.goal === 'aggressive_cut' || input.goal === 'lose_fat')) {
    notes.push('Safety override: BMI indicates underweight range, deficit disabled.');
    return { adjustment: 0, notes };
  }

  const rate = input.weeklyRatePercent;
  const deficitCap = Math.round(input.tdee * DEFICIT_CAP_RATIO);
  const surplusCap = Math.round(input.tdee * SURPLUS_CAP_RATIO);

  const fromRate = (percentPerWeek: number): number => {
    const kgPerWeek = input.weightKg * (percentPerWeek / 100);
    return Math.round((kgPerWeek * KCAL_PER_KG) / 7);
  };

  if (input.goal === 'aggressive_cut') {
    const raw = fromRate(rate ?? 1.0);
    const capped = Math.min(raw, deficitCap);
    notes.push(
      `Aggressive cut target uses ~${rate ?? 1.0}% bodyweight loss/week with a ${DEFICIT_CAP_RATIO * 100}% TDEE cap.`
    );
    return { adjustment: -capped, notes };
  }

  if (input.goal === 'fat_loss' || input.goal === 'lose_fat') {
    const raw = fromRate(rate ?? 0.5);
    const capped = Math.min(raw, deficitCap);
    notes.push(
      `Fat loss target uses ~${rate ?? 0.5}% bodyweight loss/week with a ${DEFICIT_CAP_RATIO * 100}% TDEE cap.`
    );
    return { adjustment: -capped, notes };
  }

  if (input.goal === 'recomposition') {
    const raw = Math.round(input.tdee * 0.08);
    const capped = Math.min(raw, deficitCap);
    notes.push('Recomposition uses a mild deficit to support fat loss while preserving training performance.');
    return { adjustment: -capped, notes };
  }

  if (input.goal === 'lean_bulk' || input.goal === 'gain_muscle') {
    const raw = fromRate(rate ?? 0.25);
    const capped = Math.min(raw, surplusCap);
    notes.push(
      `Lean bulk target uses ~${rate ?? 0.25}% bodyweight gain/week with a ${SURPLUS_CAP_RATIO * 100}% TDEE cap.`
    );
    return { adjustment: capped, notes };
  }

  notes.push('Maintenance target keeps intake near TDEE.');
  return { adjustment: 0, notes };
}

export function getRecommendedCalories(
  input:
    | {
        tdee: number;
        goal: GoalType;
        weeklyRatePercent?: number;
        bmi: number;
        weightKg: number;
      }
    | number,
  legacyGoal?: string,
  legacyGoalAggressiveness?: string,
  legacyBmi?: number
): { calories: number; notes: string[]; adjustment: number } {
  const notes: string[] = [];

  const normalized =
    typeof input === 'number'
      ? {
          tdee: input,
          goal: (legacyGoal ?? 'maintain') as GoalType,
          bmi: legacyBmi ?? 25,
          weightKg: 80,
          weeklyRatePercent: undefined,
          legacyGoalAggressiveness,
          isLegacyMode: true,
        }
      : {
          ...input,
          legacyGoalAggressiveness: undefined,
          isLegacyMode: false,
        };

  const adjustmentResult = getGoalAdjustmentCalories({
    goal: normalized.goal,
    tdee: normalized.tdee,
    weeklyRatePercent: normalized.weeklyRatePercent,
    bmi: normalized.bmi,
    weightKg: normalized.weightKg,
    goalAggressiveness: normalized.legacyGoalAggressiveness,
    isLegacyMode: normalized.isLegacyMode,
  });

  notes.push(...adjustmentResult.notes);

  const recommended = Math.max(1200, Math.round(normalized.tdee + adjustmentResult.adjustment));
  notes.push('This is a starting estimate. Track 2-3 week trend and adjust 100-200 kcal if needed.');

  return { calories: recommended, notes, adjustment: adjustmentResult.adjustment };
}

function getProteinPerKg(goal: GoalType | undefined): number {
  if (goal === 'aggressive_cut') return 2.6;
  if (goal === 'fat_loss' || goal === 'lose_fat' || goal === 'recomposition') return 2.4;
  if (goal === 'lean_bulk' || goal === 'gain_muscle') return 2.0;
  return 1.8;
}

export function calculateMacroRecommendations(
  caloriesPerDay: number,
  weightKg: number,
  goal: GoalType | undefined
): { protein: number; carbs: number; fat: number; proteinPerKg: number; fatFloorGrams: number } {
  const proteinPerKg = getProteinPerKg(goal);
  const protein = Math.round(weightKg * proteinPerKg);
  const proteinCalories = protein * 4;

  const fatFloorGrams = Math.round(weightKg * FAT_FLOOR_PER_KG);
  const fatFloorCalories = fatFloorGrams * 9;

  const minimumCaloriesNeeded = proteinCalories + fatFloorCalories;
  const safeCalories = Math.max(caloriesPerDay, minimumCaloriesNeeded);
  const remainingCalories = safeCalories - proteinCalories - fatFloorCalories;

  const carbs = Math.max(0, Math.round((remainingCalories * 0.65) / 4));
  const fat = Math.max(fatFloorGrams, Math.round((fatFloorCalories + remainingCalories * 0.35) / 9));

  return {
    protein,
    carbs,
    fat,
    proteinPerKg,
    fatFloorGrams,
  };
}

export async function calculateHealthMetrics(input: unknown): Promise<HealthMetricsOutput | { error: string }> {
  try {
    const validated = HealthMetricsSchema.parse(input);

    const bmi = calculateBMI(validated.weightKg, validated.heightCm);
    const bmiCategory = getBMICategory(bmi);

    const normalizedActivity = normalizeActivityLevel(validated.activityLevel);
    const formulaUsed: 'mifflin' | 'katch' =
      validated.formulaPreference === 'katch' ||
      (validated.formulaPreference === 'auto' && typeof validated.bodyFatPercentage === 'number')
        ? 'katch'
        : 'mifflin';

    const bmr =
      formulaUsed === 'katch' && typeof validated.bodyFatPercentage === 'number'
        ? calculateBMRKatch(validated.weightKg, validated.bodyFatPercentage)
        : calculateBMR(validated.weightKg, validated.heightCm, validated.age, validated.gender);

    const tdee = calculateTDEE(bmr, normalizedActivity);

    const caloriesResult = getRecommendedCalories({
      tdee,
      goal: validated.goal,
      weeklyRatePercent: validated.weeklyRatePercent,
      bmi,
      weightKg: validated.weightKg,
    });

    const macros = calculateMacroRecommendations(caloriesResult.calories, validated.weightKg, validated.goal);

    const isSafeToDeficit = bmi >= 18.5;

    return {
      bmi,
      bmr,
      tdee,
      recommendedCalories: caloriesResult.calories,
      bmiCategory,
      macros: {
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
      },
      notes: caloriesResult.notes,
      isSafeToDeficit,
      calculationDetails: {
        formulaUsed,
        activityLevel: normalizedActivity,
        activityMultiplier: ACTIVITY_MULTIPLIERS[normalizedActivity],
        goal: validated.goal,
        goalAdjustmentCalories: caloriesResult.adjustment,
        proteinPerKg: macros.proteinPerKg,
        fatFloorGrams: macros.fatFloorGrams,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
      return { error: messages };
    }
    return { error: 'Failed to calculate health metrics' };
  }
}
