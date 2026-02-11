import { z } from 'zod';

// Activity level multipliers (Mifflin-St Jeor adjusted)
export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9,
  // Map existing enum values
  LOW: 1.2,
  MODERATE: 1.55,
  HIGH: 1.725,
};

// Zod validation schema
export const HealthMetricsSchema = z.object({
  weightKg: z.coerce.number().min(30, 'Weight must be at least 30kg').max(250, 'Weight cannot exceed 250kg'),
  heightCm: z.coerce.number().min(120, 'Height must be at least 120cm').max(230, 'Height cannot exceed 230cm'),
  age: z.coerce.number().min(10, 'Age must be at least 10').max(100, 'Age cannot exceed 100'),
  gender: z.enum(['male', 'female'], { errorMap: () => ({ message: 'Gender must be male or female' }) }),
  activityLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'sedentary', 'light', 'moderate', 'very_active', 'athlete'], {
    errorMap: () => ({ message: 'Invalid activity level' }),
  }),
  goal: z.enum(['lose_fat', 'maintain', 'gain_muscle']).optional(),
  goalAggressiveness: z.enum(['conservative', 'standard', 'aggressive']).optional(),
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
}

/**
 * Calculate BMI from weight and height
 * Formula: weight (kg) / (height (m))²
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

/**
 * Get BMI category
 */
export function getBMICategory(bmi: number): 'underweight' | 'normal' | 'overweight' | 'obese' {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 * Men: 10*kg + 6.25*cm - 5*age + 5
 * Women: 10*kg + 6.25*cm - 5*age - 161
 */
export function calculateBMR(weightKg: number, heightCm: number, age: number, gender: 'male' | 'female'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === 'male' ? base + 5 : base - 161;
  return Math.round(bmr);
}

/**
 * Calculate Total Daily Energy Expenditure
 */
export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
}

/**
 * Get recommended daily calories based on goal
 */
export function getRecommendedCalories(
  tdee: number,
  goal: string | undefined,
  goalAggressiveness: string | undefined,
  bmi: number
): { calories: number; notes: string[] } {
  const notes: string[] = [];
  const aggressiveness = goalAggressiveness || 'standard';

  // Safety override: underweight clients should not cut
  if (bmi < 18.5) {
    notes.push(
      '⚠️ Your BMI suggests you may be underweight. Avoid cutting calories; prioritize proper nutrition and building mass.'
    );
    return { calories: tdee, notes };
  }

  let adjustment = 0;

  if (goal === 'lose_fat') {
    const deficits: Record<string, number> = { conservative: -300, standard: -400, aggressive: -500 };
    adjustment = deficits[aggressiveness] || -400;
    notes.push(
      `Weight loss: ${Math.abs(adjustment)} kcal deficit expected to lose ~${((Math.abs(adjustment) / 1000) * 0.5).toFixed(1)} kg/week`
    );
  } else if (goal === 'gain_muscle') {
    const surpluses: Record<string, number> = { conservative: 200, standard: 250, aggressive: 300 };
    adjustment = surpluses[aggressiveness] || 250;
    notes.push(
      `Muscle gain: ${adjustment} kcal surplus expected to gain ~${((adjustment / 1000) * 0.5).toFixed(1)} kg/week`
    );
  } else {
    notes.push('Maintenance: eating at TDEE to sustain current weight');
  }

  const recommended = Math.round(tdee + adjustment);
  notes.push('Monitor weekly average weight; adjust by 150–200 kcal if progress stalls.');
  notes.push('This is a starting estimate. Individual factors vary; adjust based on 2-3 week trends.');

  return { calories: recommended, notes };
}

/**
 * Calculate macro recommendations based on calorie goal and goal type
 * Protein: 1.6-2.2g per kg for muscle gain, 1.6g for fat loss
 * Carbs & Fat: adjust ratios based on preference
 */
export function calculateMacroRecommendations(
  caloriesPerDay: number,
  weightKg: number,
  goal: string | undefined
): { protein: number; carbs: number; fat: number } {
  // Protein priority
  const proteinPerKg = goal === 'gain_muscle' ? 2.0 : goal === 'lose_fat' ? 1.6 : 1.8;
  const protein = Math.round(weightKg * proteinPerKg);
  const proteinCalories = protein * 4;

  // Remaining calories for carbs and fat
  const remainingCalories = caloriesPerDay - proteinCalories;

  // Default split: 50% carbs, 50% fat (adjustable based on preference)
  const carbCalories = remainingCalories * 0.5;
  const fatCalories = remainingCalories * 0.5;

  const carbs = Math.round(carbCalories / 4);
  const fat = Math.round(fatCalories / 9);

  return { protein, carbs, fat };
}

/**
 * Main calculator function - validates input and returns all metrics
 */
export async function calculateHealthMetrics(input: unknown): Promise<HealthMetricsOutput | { error: string }> {
  try {
    const validated = HealthMetricsSchema.parse(input);

    const bmi = calculateBMI(validated.weightKg, validated.heightCm);
    const bmiCategory = getBMICategory(bmi);
    const bmr = calculateBMR(validated.weightKg, validated.heightCm, validated.age, validated.gender);
    const tdee = calculateTDEE(bmr, validated.activityLevel);

    const { calories: recommendedCalories, notes: calorieNotes } = getRecommendedCalories(
      tdee,
      validated.goal,
      validated.goalAggressiveness,
      bmi
    );

    const macros = calculateMacroRecommendations(recommendedCalories, validated.weightKg, validated.goal);

    const isSafeToDeficit = bmi >= 18.5;

    return {
      bmi,
      bmr,
      tdee,
      recommendedCalories,
      bmiCategory,
      macros,
      notes: calorieNotes,
      isSafeToDeficit,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join('; ');
      return { error: messages };
    }
    return { error: 'Failed to calculate health metrics' };
  }
}
