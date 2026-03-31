import { z } from 'zod';

const DEFAULT_DEFICIT_CAP_RATIO = 0.25;
const LEAN_CLIENT_DEFICIT_CAP_RATIO = 0.2;
const PERFORMANCE_DEFICIT_CAP_RATIO = 0.15;
const DEFAULT_SURPLUS_CAP_RATIO = 0.15;
const PERFORMANCE_SURPLUS_CAP_RATIO = 0.1;
const KCAL_PER_KG_WEIGHT_CHANGE = 7700;
const GENERAL_FAT_FLOOR_PER_KG = 0.6;
const PERFORMANCE_FAT_FLOOR_PER_KG = 0.7;
const FEMALE_BASE_CALORIE_FLOOR = 1300;
const MALE_BASE_CALORIE_FLOOR = 1500;
const ACTIVITY_MULTIPLIER_MIN = 1.2;
const ACTIVITY_MULTIPLIER_MAX = 1.9;
const BODY_FAT_MIN = 3;
const BODY_FAT_MAX = 60;
const WAIST_MIN_CM = 50;
const WAIST_MAX_CM = 150;

const CALORIE_FLOOR_MULTIPLIER_BY_PHASE = {
  GENERAL_FAT_LOSS: 18,
  HARD_CUT: 19,
  RECOMP: 20,
  PERFORMANCE: 21,
  LEAN_BULK: 21,
} as const;

const LEGACY_ACTIVITY_MULTIPLIERS = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  VERY_ACTIVE: 1.725,
  ATHLETE: 1.9,
} as const;

const OCCUPATION_ACTIVITY_BASE = {
  DESK: 1.25,
  MIXED: 1.45,
  PHYSICAL: 1.6,
} as const;

const STEP_SCORE_BANDS = [
  { max: 4999, score: 0 },
  { max: 8999, score: 0.5 },
  { max: 11999, score: 1 },
  { max: Number.POSITIVE_INFINITY, score: 1.5 },
] as const;

const RESISTANCE_SCORE_BANDS = [
  { max: 0, score: 0 },
  { max: 2, score: 0.5 },
  { max: 4, score: 1 },
  { max: Number.POSITIVE_INFINITY, score: 1.5 },
] as const;

const CARDIO_SCORE_BANDS = [
  { max: 0, score: 0 },
  { max: 90, score: 0.5 },
  { max: 200, score: 1 },
  { max: Number.POSITIVE_INFINITY, score: 1.5 },
] as const;

const healthMetricsLegacyGoalSchema = z.enum([
  'fat_loss',
  'aggressive_cut',
  'recomposition',
  'lean_bulk',
  'maintenance',
  'lose_fat',
  'maintain',
  'gain_muscle',
]);

export const activitySchema = z.enum([
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

export const healthMetricsFormulaPreferenceSchema = z.enum(['auto', 'mifflin', 'katch']);
export const occupationActivitySchema = z.enum(['DESK', 'MIXED', 'PHYSICAL']);
export const goalDirectionSchema = z.enum(['LOSS', 'MAINTAIN', 'GAIN']);
export const coachingPhaseSchema = z.enum(['GENERAL_FAT_LOSS', 'HARD_CUT', 'RECOMP', 'PERFORMANCE', 'LEAN_BULK']);
export const macroModeSchema = z.enum([
  'BALANCED',
  'HIGH_CARB_PERFORMANCE',
  'HIGH_FAT_APPETITE_CONTROL',
  'PROTEIN_PRIORITY_CUT',
]);
export const waistRiskSchema = z.enum(['NORMAL', 'ELEVATED', 'HIGH']);

export type GoalType = z.infer<typeof healthMetricsLegacyGoalSchema> | string;
export type FormulaPreference = z.infer<typeof healthMetricsFormulaPreferenceSchema>;
export type OccupationActivity = z.infer<typeof occupationActivitySchema>;
export type GoalDirection = z.infer<typeof goalDirectionSchema>;
export type CoachingPhase = z.infer<typeof coachingPhaseSchema>;
export type MacroMode = z.infer<typeof macroModeSchema>;
export type WaistRisk = z.infer<typeof waistRiskSchema>;
export type LegacyActivityLevel = keyof typeof LEGACY_ACTIVITY_MULTIPLIERS;

export const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  ...LEGACY_ACTIVITY_MULTIPLIERS,
  LOW: LEGACY_ACTIVITY_MULTIPLIERS.SEDENTARY,
  HIGH: LEGACY_ACTIVITY_MULTIPLIERS.VERY_ACTIVE,
  sedentary: LEGACY_ACTIVITY_MULTIPLIERS.SEDENTARY,
  light: LEGACY_ACTIVITY_MULTIPLIERS.LIGHT,
  moderate: LEGACY_ACTIVITY_MULTIPLIERS.MODERATE,
  very_active: LEGACY_ACTIVITY_MULTIPLIERS.VERY_ACTIVE,
  athlete: LEGACY_ACTIVITY_MULTIPLIERS.ATHLETE,
};

export const CompositeActivitySchema = z.object({
  averageDailySteps: z.coerce.number().min(0).max(50000),
  resistanceSessionsPerWeek: z.coerce.number().min(0).max(14),
  cardioMinutesPerWeek: z.coerce.number().min(0).max(2000),
  occupationActivity: occupationActivitySchema,
});

export const HealthMetricsSchema = z
  .object({
    weightKg: z.coerce.number().min(30, 'Weight must be at least 30kg').max(250, 'Weight cannot exceed 250kg'),
    heightCm: z.coerce.number().min(120, 'Height must be at least 120cm').max(230, 'Height cannot exceed 230cm'),
    age: z.coerce.number().min(10, 'Age must be at least 10').max(100, 'Age cannot exceed 100'),
    gender: z.enum(['male', 'female']).catch('male'),
    activityLevel: activitySchema.optional(),
    goal: healthMetricsLegacyGoalSchema.default('fat_loss'),
    weeklyRatePercent: z.coerce.number().min(0.1).max(1.2).optional(),
    bodyFatPercentage: z.coerce.number().min(BODY_FAT_MIN).max(BODY_FAT_MAX).optional(),
    formulaPreference: healthMetricsFormulaPreferenceSchema.default('auto'),
    compositeActivity: CompositeActivitySchema.optional(),
    goalDirection: goalDirectionSchema.optional(),
    coachingPhase: coachingPhaseSchema.optional(),
    isLeanClient: z.coerce.boolean().optional(),
    waistCircumferenceCm: z.coerce.number().min(WAIST_MIN_CM).max(WAIST_MAX_CM).optional(),
    macroMode: macroModeSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.activityLevel && !value.compositeActivity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['activityLevel'],
        message: 'Provide either activityLevel or compositeActivity',
      });
    }
  });

export type CompositeActivity = z.infer<typeof CompositeActivitySchema>;
export type HealthMetricsInput = z.infer<typeof HealthMetricsSchema>;

export interface HealthMetricsOutput {
  bmi: number;
  waistRisk?: WaistRisk;
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
  safetyWarnings: string[];
  requiresCoachReview: boolean;
  isSafeToDeficit: boolean;
  calculationDetails: {
    formulaUsed: 'mifflin' | 'katch';
    activityLevel: LegacyActivityLevel;
    activityMultiplier: number;
    goal: GoalType;
    goalAdjustmentCalories: number;
    proteinPerKg: number;
    fatFloorGrams: number;
    coachingPhase?: CoachingPhase;
    macroMode?: MacroMode;
    activityExplanation?: string;
    proteinStrategy?: string;
    dynamicCalorieFloor?: number;
    goalDirection?: GoalDirection;
  };
}

type MacroRecommendationOptions = {
  coachingPhase?: CoachingPhase;
  macroMode?: MacroMode;
  bodyFatPercentage?: number;
  isLeanClient?: boolean;
};

type ResolvedMacroRecommendationOptions = {
  coachingPhase: CoachingPhase;
  macroMode: MacroMode;
  bodyFatPercentage?: number;
  isLeanClient: boolean;
};

type MacroRecommendationResult = {
  protein: number;
  carbs: number;
  fat: number;
  proteinPerKg: number;
  fatFloorGrams: number;
  proteinStrategy: string;
};

type RateAdjustmentParams = {
  goalDirection: GoalDirection;
  weeklyRatePercent?: number;
  tdee: number;
  weightKg: number;
  coachingPhase: CoachingPhase;
  isLeanClient?: boolean;
};

type GoalContext = {
  legacyGoal: GoalType;
  goalDirection: GoalDirection;
  coachingPhase: CoachingPhase;
  weeklyRatePercent?: number;
  macroMode: MacroMode;
};

type TrainingPerformanceTrend = 'improving' | 'stable' | 'declining';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function getBandScore(value: number, bands: ReadonlyArray<{ max: number; score: number }>): number {
  const band = bands.find(entry => value <= entry.max);
  return band?.score ?? 0;
}

function isValidBodyFatPercentage(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= BODY_FAT_MIN && value <= BODY_FAT_MAX;
}

function normalizeActivityLevel(level: string): LegacyActivityLevel {
  const key = level.trim().toUpperCase();
  if (key === 'LOW' || key === 'SEDENTARY') return 'SEDENTARY';
  if (key === 'LIGHT') return 'LIGHT';
  if (key === 'MODERATE') return 'MODERATE';
  if (key === 'HIGH' || key === 'VERY_ACTIVE') return 'VERY_ACTIVE';
  if (key === 'ATHLETE') return 'ATHLETE';
  return 'MODERATE';
}

function getClosestActivityLevel(multiplier: number): LegacyActivityLevel {
  const entries = Object.entries(LEGACY_ACTIVITY_MULTIPLIERS) as Array<[LegacyActivityLevel, number]>;
  return entries.reduce((closest, current) => {
    const closestDelta = Math.abs(closest[1] - multiplier);
    const currentDelta = Math.abs(current[1] - multiplier);
    return currentDelta < closestDelta ? current : closest;
  })[0];
}

function mapLegacyGoalToDirection(goal: GoalType): GoalDirection {
  if (goal === 'lean_bulk' || goal === 'gain_muscle') return 'GAIN';
  if (goal === 'maintenance' || goal === 'maintain' || goal === 'recomposition') return 'MAINTAIN';
  return 'LOSS';
}

function mapLegacyGoalToPhase(goal: GoalType): CoachingPhase {
  if (goal === 'aggressive_cut') return 'HARD_CUT';
  if (goal === 'recomposition') return 'RECOMP';
  if (goal === 'lean_bulk' || goal === 'gain_muscle') return 'LEAN_BULK';
  if (goal === 'maintenance' || goal === 'maintain') return 'PERFORMANCE';
  return 'GENERAL_FAT_LOSS';
}

function getDefaultWeeklyRatePercent(goalDirection: GoalDirection, coachingPhase: CoachingPhase): number | undefined {
  if (goalDirection === 'GAIN') return 0.25;
  if (goalDirection === 'LOSS' && coachingPhase === 'HARD_CUT') return 1;
  if (goalDirection === 'LOSS') return 0.5;
  if (goalDirection === 'MAINTAIN' && coachingPhase === 'RECOMP') return 0.25;
  return undefined;
}

function getDefaultMacroMode(coachingPhase: CoachingPhase): MacroMode {
  if (coachingPhase === 'HARD_CUT') return 'PROTEIN_PRIORITY_CUT';
  if (coachingPhase === 'PERFORMANCE') return 'HIGH_CARB_PERFORMANCE';
  return 'BALANCED';
}

function resolveGoalContext(input: HealthMetricsInput): GoalContext {
  const legacyGoal = input.goal;
  const coachingPhase = input.coachingPhase ?? mapLegacyGoalToPhase(legacyGoal);
  const goalDirection = input.goalDirection ?? mapLegacyGoalToDirection(legacyGoal);
  const weeklyRatePercent = input.weeklyRatePercent ?? getDefaultWeeklyRatePercent(goalDirection, coachingPhase);
  const macroMode = input.macroMode ?? getDefaultMacroMode(coachingPhase);

  return {
    legacyGoal,
    goalDirection,
    coachingPhase,
    weeklyRatePercent,
    macroMode,
  };
}

function getLegacyActivityInfo(level: string): {
  activityLevel: LegacyActivityLevel;
  activityMultiplier: number;
  activityExplanation: string;
} {
  const activityLevel = normalizeActivityLevel(level);
  const activityMultiplier = LEGACY_ACTIVITY_MULTIPLIERS[activityLevel];
  return {
    activityLevel,
    activityMultiplier,
    activityExplanation: `Legacy activity level ${activityLevel.toLowerCase().replace('_', ' ')} mapped to multiplier ${activityMultiplier.toFixed(3)}.`,
  };
}

function caloriesFromRate(weightKg: number, weeklyRatePercent: number): number {
  const kgPerWeek = weightKg * (weeklyRatePercent / 100);
  return Math.round((kgPerWeek * KCAL_PER_KG_WEIGHT_CHANGE) / 7);
}

function getMacroSplit(mode: MacroMode): { carbShare: number; fatShare: number } {
  if (mode === 'HIGH_CARB_PERFORMANCE') return { carbShare: 0.7, fatShare: 0.3 };
  if (mode === 'HIGH_FAT_APPETITE_CONTROL') return { carbShare: 0.3, fatShare: 0.7 };
  if (mode === 'PROTEIN_PRIORITY_CUT') return { carbShare: 0.5, fatShare: 0.5 };
  return { carbShare: 0.55, fatShare: 0.45 };
}

function resolveMacroOptions(
  goalOrOptions?: GoalType | MacroRecommendationOptions,
): ResolvedMacroRecommendationOptions {
  if (!goalOrOptions || typeof goalOrOptions === 'string') {
    const coachingPhase = goalOrOptions ? mapLegacyGoalToPhase(goalOrOptions) : 'GENERAL_FAT_LOSS';
    return {
      coachingPhase,
      macroMode: getDefaultMacroMode(coachingPhase),
      bodyFatPercentage: undefined,
      isLeanClient: false,
    };
  }

  const coachingPhase = goalOrOptions.coachingPhase ?? 'GENERAL_FAT_LOSS';
  return {
    coachingPhase,
    macroMode: goalOrOptions.macroMode ?? getDefaultMacroMode(coachingPhase),
    bodyFatPercentage: goalOrOptions.bodyFatPercentage,
    isLeanClient: goalOrOptions.isLeanClient ?? false,
  };
}

function getProteinTarget(
  weightKg: number,
  options: ResolvedMacroRecommendationOptions,
): {
  protein: number;
  proteinPerKg: number;
  proteinStrategy: string;
} {
  const bodyFatPercentage = options.bodyFatPercentage;
  const validBodyFat = isValidBodyFatPercentage(bodyFatPercentage);
  const leanMassKg = validBodyFat ? weightKg * (1 - bodyFatPercentage / 100) : null;

  if ((options.coachingPhase === 'HARD_CUT' || options.isLeanClient) && leanMassKg) {
    const gramsPerKgFfm = options.isLeanClient ? 3.1 : 2.9;
    const protein = Math.round(leanMassKg * gramsPerKgFfm);
    return {
      protein,
      proteinPerKg: round1(protein / weightKg),
      proteinStrategy: `${gramsPerKgFfm.toFixed(1)} g/kg FFM because body-fat data is available for a lean or hard-cut profile.`,
    };
  }

  const proteinPerKg =
    options.coachingPhase === 'HARD_CUT'
      ? 2.5
      : options.coachingPhase === 'GENERAL_FAT_LOSS'
        ? 2.1
        : options.coachingPhase === 'RECOMP'
          ? 2.1
          : 1.8;

  return {
    protein: Math.round(weightKg * proteinPerKg),
    proteinPerKg,
    proteinStrategy: `${proteinPerKg.toFixed(1)} g/kg bodyweight based on coaching phase ${options.coachingPhase.toLowerCase().replace(/_/g, ' ')}.`,
  };
}

function buildSafetyWarnings(input: {
  bmi: number;
  goalDirection: GoalDirection;
  coachingPhase: CoachingPhase;
  weeklyRatePercent?: number;
  waistRisk?: WaistRisk;
  isLeanClient?: boolean;
  recommendedCalories: number;
  dynamicCalorieFloor: number;
}): { safetyWarnings: string[]; requiresCoachReview: boolean } {
  const safetyWarnings: string[] = [];
  let requiresCoachReview = false;

  if (input.bmi < 18.5 && input.goalDirection === 'LOSS') {
    safetyWarnings.push(
      'Underweight BMI with an active fat-loss target requires direct coach review before applying a deficit.',
    );
    requiresCoachReview = true;
  }

  if (input.isLeanClient && input.goalDirection === 'LOSS' && (input.weeklyRatePercent ?? 0) > 0.5) {
    safetyWarnings.push('Lean clients should usually use a slower loss rate to reduce performance and recovery risk.');
    requiresCoachReview = true;
  }

  if (input.coachingPhase === 'PERFORMANCE' && input.goalDirection === 'LOSS') {
    safetyWarnings.push(
      'Performance-focused phases should use conservative deficits and close training feedback monitoring.',
    );
  }

  if (input.waistRisk === 'ELEVATED') {
    safetyWarnings.push(
      'Waist circumference is elevated and should be tracked alongside bodyweight and recovery markers.',
    );
  }

  if (input.waistRisk === 'HIGH') {
    safetyWarnings.push('Waist circumference is in a high-risk range and warrants closer coaching review.');
    requiresCoachReview = true;
  }

  if (input.recommendedCalories === input.dynamicCalorieFloor) {
    safetyWarnings.push(
      'The recommendation hit the dynamic calorie floor, so further calorie reduction should not be automated.',
    );
    requiresCoachReview = true;
  }

  return { safetyWarnings, requiresCoachReview };
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return round1(weightKg / (heightM * heightM));
}

export function getBMICategory(bmi: number): 'underweight' | 'normal' | 'overweight' | 'obese' {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

export function calculateBMR(weightKg: number, heightCm: number, age: number, gender: 'male' | 'female'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

export function calculateBMRKatch(weightKg: number, bodyFatPercentage: number): number {
  const leanMassKg = weightKg * (1 - bodyFatPercentage / 100);
  return Math.round(370 + 21.6 * leanMassKg);
}

export function deriveActivityMultiplier(activity: CompositeActivity): { multiplier: number; explanation: string } {
  const stepScore = getBandScore(activity.averageDailySteps, STEP_SCORE_BANDS);
  const resistanceScore = getBandScore(activity.resistanceSessionsPerWeek, RESISTANCE_SCORE_BANDS);
  const cardioScore = getBandScore(activity.cardioMinutesPerWeek, CARDIO_SCORE_BANDS);
  const baseMultiplier = OCCUPATION_ACTIVITY_BASE[activity.occupationActivity];
  const rawMultiplier = baseMultiplier + (stepScore + resistanceScore + cardioScore) * 0.05;
  const multiplier = round1(clamp(rawMultiplier, ACTIVITY_MULTIPLIER_MIN, ACTIVITY_MULTIPLIER_MAX));

  return {
    multiplier,
    explanation: `Occupation ${activity.occupationActivity.toLowerCase()} base ${baseMultiplier.toFixed(2)}, steps ${activity.averageDailySteps}/day, resistance ${activity.resistanceSessionsPerWeek}/week, cardio ${activity.cardioMinutesPerWeek} min/week.`,
  };
}

export function calculateTDEE(bmr: number, activityMultiplierOrLegacyLevel: number | string): number {
  const multiplier =
    typeof activityMultiplierOrLegacyLevel === 'number'
      ? activityMultiplierOrLegacyLevel
      : LEGACY_ACTIVITY_MULTIPLIERS[normalizeActivityLevel(activityMultiplierOrLegacyLevel)];

  return Math.round(bmr * multiplier);
}

export function calculateRateBasedAdjustment(params: RateAdjustmentParams): { adjustment: number; notes: string[] } {
  const notes: string[] = [];
  const deficitCapRatio = params.isLeanClient
    ? LEAN_CLIENT_DEFICIT_CAP_RATIO
    : params.coachingPhase === 'PERFORMANCE' || params.coachingPhase === 'RECOMP'
      ? PERFORMANCE_DEFICIT_CAP_RATIO
      : DEFAULT_DEFICIT_CAP_RATIO;
  const surplusCapRatio =
    params.coachingPhase === 'PERFORMANCE' ? PERFORMANCE_SURPLUS_CAP_RATIO : DEFAULT_SURPLUS_CAP_RATIO;
  const deficitCap = Math.round(params.tdee * deficitCapRatio);
  const surplusCap = Math.round(params.tdee * surplusCapRatio);

  if (params.goalDirection === 'LOSS') {
    const rate = params.weeklyRatePercent ?? getDefaultWeeklyRatePercent('LOSS', params.coachingPhase) ?? 0.5;
    const raw = caloriesFromRate(params.weightKg, rate);
    const capped = Math.min(raw, deficitCap);
    notes.push(
      `Loss target uses ${rate}% bodyweight change per week with a ${(deficitCapRatio * 100).toFixed(0)}% TDEE cap.`,
    );
    return { adjustment: -capped, notes };
  }

  if (params.goalDirection === 'GAIN') {
    const rate = params.weeklyRatePercent ?? 0.25;
    const raw = caloriesFromRate(params.weightKg, rate);
    const capped = Math.min(raw, surplusCap);
    notes.push(
      `Gain target uses ${rate}% bodyweight change per week with a ${(surplusCapRatio * 100).toFixed(0)}% TDEE cap.`,
    );
    return { adjustment: capped, notes };
  }

  if (params.coachingPhase === 'RECOMP') {
    const mildDeficit = Math.min(Math.round(params.tdee * 0.05), deficitCap);
    notes.push(
      'Recomp phase uses a small calorie reduction to support body composition change without pushing performance too hard.',
    );
    return { adjustment: -mildDeficit, notes };
  }

  notes.push('Maintenance target keeps intake close to estimated expenditure.');
  return { adjustment: 0, notes };
}

export function calculateDynamicCalorieFloor(
  weightKg: number,
  coachingPhase: CoachingPhase,
  gender: 'male' | 'female',
): number {
  const weightBasedFloor = Math.round(weightKg * CALORIE_FLOOR_MULTIPLIER_BY_PHASE[coachingPhase]);
  const sexFloor = gender === 'male' ? MALE_BASE_CALORIE_FLOOR : FEMALE_BASE_CALORIE_FLOOR;
  return Math.max(weightBasedFloor, sexFloor);
}

export function getWaistRisk(waistCm: number, gender: 'male' | 'female'): WaistRisk {
  if (gender === 'male') {
    if (waistCm > 102) return 'HIGH';
    if (waistCm >= 94) return 'ELEVATED';
    return 'NORMAL';
  }

  if (waistCm > 88) return 'HIGH';
  if (waistCm >= 80) return 'ELEVATED';
  return 'NORMAL';
}

export function getTrendBasedRecalibration(input: {
  averageWeeklyWeightChange: number;
  adherenceScore: number;
  trainingPerformanceTrend: TrainingPerformanceTrend;
}): { adjustment: number; reasoning: string } {
  if (input.adherenceScore < 0.7) {
    return {
      adjustment: 0,
      reasoning: 'Hold calories steady and improve adherence before making calorie changes.',
    };
  }

  if (input.trainingPerformanceTrend === 'declining' && input.averageWeeklyWeightChange <= -0.4) {
    return {
      adjustment: 150,
      reasoning: 'Performance is dropping while weight is trending down, so increase intake by 150 kcal.',
    };
  }

  if (input.averageWeeklyWeightChange <= -0.9) {
    return {
      adjustment: 200,
      reasoning: 'Weight is dropping too quickly, so increase intake by 200 kcal.',
    };
  }

  if (input.averageWeeklyWeightChange >= -0.1 && input.averageWeeklyWeightChange <= 0.1) {
    return {
      adjustment: -100,
      reasoning: 'Weight trend is essentially flat with good adherence, so reduce intake by 100 kcal.',
    };
  }

  if (input.averageWeeklyWeightChange > 0.25) {
    return {
      adjustment: -150,
      reasoning: 'Weight is trending upward, so reduce intake by 150 kcal.',
    };
  }

  return {
    adjustment: 0,
    reasoning: 'Current trend is acceptable, so keep calories unchanged for now.',
  };
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
  legacyBmi?: number,
): { calories: number; notes: string[]; adjustment: number } {
  const normalizedGoal = typeof input === 'number' ? (legacyGoal ?? 'maintain') : input.goal;
  const goalDirection = mapLegacyGoalToDirection(normalizedGoal);
  const coachingPhase = mapLegacyGoalToPhase(normalizedGoal);
  const tdee = typeof input === 'number' ? input : input.tdee;
  const weightKg = typeof input === 'number' ? 80 : input.weightKg;
  const bmi = typeof input === 'number' ? (legacyBmi ?? 25) : input.bmi;
  const weeklyRatePercent = typeof input === 'number' ? undefined : input.weeklyRatePercent;
  const adjustment = calculateRateBasedAdjustment({
    goalDirection,
    weeklyRatePercent,
    tdee,
    weightKg,
    coachingPhase,
  });
  const floor = Math.max(FEMALE_BASE_CALORIE_FLOOR, Math.round(weightKg * 18));
  const calories = Math.max(floor, Math.round(tdee + adjustment.adjustment));
  const notes = [...adjustment.notes];

  if (bmi < 18.5 && goalDirection === 'LOSS') {
    notes.push('Safety override: underweight BMI profile should not run an active deficit without coach review.');
  }

  if (legacyGoalAggressiveness) {
    notes.push(
      `Legacy aggressiveness input '${legacyGoalAggressiveness}' is deprecated and now mapped through rate-based logic.`,
    );
  }

  notes.push(
    'Use this as a starting prescription and adjust from scale trend, adherence, and training performance after 2 to 3 weeks.',
  );

  return {
    calories,
    notes,
    adjustment: adjustment.adjustment,
  };
}

export function calculateMacroRecommendations(
  caloriesPerDay: number,
  weightKg: number,
  goalOrOptions?: GoalType | MacroRecommendationOptions,
): MacroRecommendationResult {
  const options = resolveMacroOptions(goalOrOptions);
  const proteinTarget = getProteinTarget(weightKg, options);
  const proteinCalories = proteinTarget.protein * 4;
  const fatFloorPerKg =
    options.coachingPhase === 'PERFORMANCE' || options.coachingPhase === 'LEAN_BULK'
      ? PERFORMANCE_FAT_FLOOR_PER_KG
      : GENERAL_FAT_FLOOR_PER_KG;
  const fatFloorGrams = Math.round(weightKg * fatFloorPerKg);
  const fatFloorCalories = fatFloorGrams * 9;
  const minimumCaloriesNeeded = proteinCalories + fatFloorCalories;
  const safeCalories = Math.max(caloriesPerDay, minimumCaloriesNeeded);
  const remainingCalories = Math.max(0, safeCalories - proteinCalories - fatFloorCalories);
  const split = getMacroSplit(options.macroMode);
  const carbs = Math.round((remainingCalories * split.carbShare) / 4);
  const fat = Math.max(fatFloorGrams, Math.round((fatFloorCalories + remainingCalories * split.fatShare) / 9));

  return {
    protein: proteinTarget.protein,
    carbs,
    fat,
    proteinPerKg: proteinTarget.proteinPerKg,
    fatFloorGrams,
    proteinStrategy: proteinTarget.proteinStrategy,
  };
}

export async function calculateHealthMetrics(input: unknown): Promise<HealthMetricsOutput | { error: string }> {
  try {
    const validated = HealthMetricsSchema.parse(input);
    const goalContext = resolveGoalContext(validated);
    const bmi = calculateBMI(validated.weightKg, validated.heightCm);
    const bmiCategory = getBMICategory(bmi);
    const validBodyFat = isValidBodyFatPercentage(validated.bodyFatPercentage);
    const notes: string[] = [];

    let formulaUsed: 'mifflin' | 'katch' = 'mifflin';
    let bmr = calculateBMR(validated.weightKg, validated.heightCm, validated.age, validated.gender);

    if (validated.formulaPreference === 'katch' && !validBodyFat) {
      notes.push(
        'Katch-McArdle was requested without a valid body-fat value, so the calculator fell back to Mifflin-St Jeor.',
      );
    }

    if (validBodyFat && (validated.formulaPreference === 'katch' || validated.formulaPreference === 'auto')) {
      formulaUsed = 'katch';
      bmr = calculateBMRKatch(validated.weightKg, validated.bodyFatPercentage as number);
    }

    const activityInfo = validated.compositeActivity
      ? (() => {
          const derived = deriveActivityMultiplier(validated.compositeActivity);
          return {
            activityLevel: getClosestActivityLevel(derived.multiplier),
            activityMultiplier: derived.multiplier,
            activityExplanation: derived.explanation,
          };
        })()
      : getLegacyActivityInfo(validated.activityLevel ?? 'MODERATE');

    const tdee = calculateTDEE(bmr, activityInfo.activityMultiplier);
    const adjustmentResult = calculateRateBasedAdjustment({
      goalDirection: goalContext.goalDirection,
      weeklyRatePercent: goalContext.weeklyRatePercent,
      tdee,
      weightKg: validated.weightKg,
      coachingPhase: goalContext.coachingPhase,
      isLeanClient: validated.isLeanClient,
    });
    notes.push(...adjustmentResult.notes);

    const dynamicCalorieFloor = calculateDynamicCalorieFloor(
      validated.weightKg,
      goalContext.coachingPhase,
      validated.gender,
    );
    const recommendedCalories = Math.max(dynamicCalorieFloor, Math.round(tdee + adjustmentResult.adjustment));
    if (recommendedCalories === dynamicCalorieFloor) {
      notes.push('The recommendation was held at the dynamic calorie floor instead of pushing lower.');
    }

    const macros = calculateMacroRecommendations(recommendedCalories, validated.weightKg, {
      coachingPhase: goalContext.coachingPhase,
      macroMode: goalContext.macroMode,
      bodyFatPercentage: validated.bodyFatPercentage,
      isLeanClient: validated.isLeanClient,
    });
    const waistRisk =
      typeof validated.waistCircumferenceCm === 'number'
        ? getWaistRisk(validated.waistCircumferenceCm, validated.gender)
        : undefined;
    if (waistRisk === 'ELEVATED') {
      notes.push('Waist circumference is elevated and should be monitored as a secondary health-risk marker.');
    }
    if (waistRisk === 'HIGH') {
      notes.push(
        'Waist circumference is high and strengthens the case for close monitoring and medical referral when appropriate.',
      );
    }

    const safety = buildSafetyWarnings({
      bmi,
      goalDirection: goalContext.goalDirection,
      coachingPhase: goalContext.coachingPhase,
      weeklyRatePercent: goalContext.weeklyRatePercent,
      waistRisk,
      isLeanClient: validated.isLeanClient,
      recommendedCalories,
      dynamicCalorieFloor,
    });

    notes.push(
      'Use the recommendation as a starting point, then recalibrate from weekly trend, adherence, and training performance rather than relying on BMI alone.',
    );

    return {
      bmi,
      waistRisk,
      bmr,
      tdee,
      recommendedCalories,
      bmiCategory,
      macros: {
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
      },
      notes,
      safetyWarnings: safety.safetyWarnings,
      requiresCoachReview: safety.requiresCoachReview,
      isSafeToDeficit: bmi >= 18.5 && !safety.requiresCoachReview,
      calculationDetails: {
        formulaUsed,
        activityLevel: activityInfo.activityLevel,
        activityMultiplier: activityInfo.activityMultiplier,
        goal: goalContext.legacyGoal,
        goalAdjustmentCalories: adjustmentResult.adjustment,
        proteinPerKg: macros.proteinPerKg,
        fatFloorGrams: macros.fatFloorGrams,
        coachingPhase: goalContext.coachingPhase,
        macroMode: goalContext.macroMode,
        activityExplanation: activityInfo.activityExplanation,
        proteinStrategy: macros.proteinStrategy,
        dynamicCalorieFloor,
        goalDirection: goalContext.goalDirection,
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
