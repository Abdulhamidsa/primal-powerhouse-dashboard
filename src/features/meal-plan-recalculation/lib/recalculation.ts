import type {
  MealPlanRecalculationValidation,
  MealPlanRecommendedAddition,
  MealPortionDelta,
  MealReplacementOpportunity,
  MealSlotNormalizationStatus,
  MealSlotSummary,
  OptimizationMode,
  RecalculationMacroTargets,
} from '@/features/meal-plan-recalculation/types/mealPlanRecalculation.types';

export const MEAL_SLOT_ORDER = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;

export type MealSlotType = (typeof MEAL_SLOT_ORDER)[number];

const SLOT_TARGET_SPLITS: Record<MealSlotType, number> = {
  BREAKFAST: 0.25,
  LUNCH: 0.35,
  DINNER: 0.3,
  SNACK: 0.1,
};

const DEFAULT_PORTION_BOUNDS = { min: 0.6, max: 1.4 } as const;
const SNACK_PORTION_BOUNDS = { min: 0.25, max: 1.4 } as const;
const ACCURACY_BLOCK_THRESHOLD = 90;
const PROTEIN_GAP_BLOCK_THRESHOLD = 15;
const MEAL_SUITABILITY_THRESHOLD: Record<MealSlotType, number> = {
  BREAKFAST: 7,
  LUNCH: 6,
  DINNER: 6,
  SNACK: 8,
};

const MAIN_MEAL_TYPES: MealSlotType[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

type MealMacros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type MealAnalysis = {
  proteinPer100Kcal: number;
  suitabilityStatus: 'good' | 'borderline' | 'poor';
  suitabilityReasons: string[];
  threshold: number;
};

type ReplacementOpportunityAnalysis = MealReplacementOpportunity;

export type MealPlanRecalculationAssignment = {
  assignmentId: string;
  mealName: string;
  mealType: MealSlotType;
  dayOfWeek: number;
  logicalOldPortion: number;
  baseMeal: MealMacros;
};

export type MealPlanRecalculationComputationInput = {
  numDays: number;
  targets: RecalculationMacroTargets;
  assignments: MealPlanRecalculationAssignment[];
  optimizationMode: OptimizationMode;
  maxMealAdjustments: number;
};

export type MealPlanRecalculationComputationResult = {
  slotSummaries: MealSlotSummary[];
  deltas: MealPortionDelta[];
  projectedWeeklyTotals: RecalculationMacroTargets;
  projectedDailyTotals: RecalculationMacroTargets;
  expectedAccuracyPercent: number;
  hasBoundsClamping: boolean;
  adjustmentsApplied: number;
  recommendedAdditions: MealPlanRecommendedAddition[];
  replacementOpportunities: MealReplacementOpportunity[];
  warning: string | null;
  validation: MealPlanRecalculationValidation;
};

function round0(value: number): number {
  return Math.round(value);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function zeroTargets(): RecalculationMacroTargets {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

function getMealProteinDensity(meal: MealMacros): number {
  if (meal.calories <= 0) return 0;
  return round1((meal.protein / meal.calories) * 100);
}

function analyzeMeal(mealType: MealSlotType, meal: MealMacros): MealAnalysis {
  const threshold = MEAL_SUITABILITY_THRESHOLD[mealType];
  const proteinPer100Kcal = getMealProteinDensity(meal);
  const suitabilityReasons: string[] = [];

  if (meal.calories <= 0) {
    suitabilityReasons.push('Meal has no calorie data.');
  }

  if (proteinPer100Kcal >= threshold) {
    suitabilityReasons.push(`Protein density is at or above the ${threshold.toFixed(1)}g/100 kcal threshold.`);
    return {
      proteinPer100Kcal,
      suitabilityStatus: 'good',
      suitabilityReasons,
      threshold,
    };
  }

  if (proteinPer100Kcal >= threshold * 0.75) {
    suitabilityReasons.push(
      `Protein density is close to the ${threshold.toFixed(1)}g/100 kcal threshold but still below it.`,
    );
    return {
      proteinPer100Kcal,
      suitabilityStatus: 'borderline',
      suitabilityReasons,
      threshold,
    };
  }

  suitabilityReasons.push(
    `Protein density is below the ${threshold.toFixed(1)}g/100 kcal threshold and is a weak candidate for scaling.`,
  );

  return {
    proteinPer100Kcal,
    suitabilityStatus: 'poor',
    suitabilityReasons,
    threshold,
  };
}

function getMissingDailyGaps(targets: RecalculationMacroTargets, projected: RecalculationMacroTargets): {
  calories: number;
  protein: number;
} {
  return {
    calories: Math.max(0, targets.calories - projected.calories),
    protein: Math.max(0, targets.protein - projected.protein),
  };
}

function buildSnackRecommendation(args: {
  numDays: number;
  dailyGaps: { calories: number; protein: number };
  reason: string;
}): MealPlanRecommendedAddition {
  const targetCalories = Math.max(0, args.dailyGaps.calories);
  const targetProtein = Math.max(0, args.dailyGaps.protein);
  const caloriesMin = Math.max(150, Math.round(targetCalories * 0.7));
  const caloriesMax = Math.max(caloriesMin + 100, Math.round(targetCalories * 1.1));
  const proteinMin = Math.max(15, Math.round(targetProtein * 0.65));
  const proteinMax = Math.max(proteinMin + 8, Math.round(targetProtein * 1.1));

  const averageCalories = (caloriesMin + caloriesMax) / 2;
  const type =
    averageCalories <= 250 ? 'SNACK' : averageCalories <= 500 ? 'HIGH_PROTEIN_SNACK' : 'ADDITIONAL_MEAL';

  return {
    type,
    daysNeeded: args.numDays,
    targetCaloriesPerDay: { min: caloriesMin, max: caloriesMax },
    targetProteinPerDay: { min: proteinMin, max: proteinMax },
    reason: args.reason,
  };
}

function formatMealTypeLabel(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function buildAdditionalMealRecommendation(args: {
  type: string;
  daysNeeded: number;
  dailyGaps: { calories: number; protein: number };
  reason: string;
}): MealPlanRecommendedAddition {
  return {
    type: args.type,
    daysNeeded: args.daysNeeded,
    targetCaloriesPerDay: {
      min: Math.max(200, Math.round(args.dailyGaps.calories * 0.65)),
      max: Math.max(300, Math.round(args.dailyGaps.calories * 0.95)),
    },
    targetProteinPerDay: {
      min: Math.max(15, Math.round(args.dailyGaps.protein * 0.55)),
      max: Math.max(25, Math.round(args.dailyGaps.protein * 0.9)),
    },
    reason: args.reason,
  };
}

function calculateReplacementOpportunityPriority(args: {
  analysis: MealAnalysis;
  proteinDensityRatio: number;
}): 'high' | 'medium' | 'low' {
  if (args.analysis.suitabilityStatus === 'poor' || args.proteinDensityRatio < 0.55) return 'high';
  if (args.analysis.suitabilityStatus === 'borderline' || args.proteinDensityRatio < 0.85) return 'medium';
  return 'low';
}

function getReplacementCoachingProfile(mealType: MealSlotType): {
  suggestedReplacementType: string;
  coachingMessage: string;
} {
  if (mealType === 'BREAKFAST') {
    return {
      suggestedReplacementType: 'HIGH_PROTEIN_BREAKFAST',
      coachingMessage:
        'Replace this with a higher-protein breakfast such as protein oats, Greek yogurt bowl, egg-white scramble, or cottage cheese bowl.',
    };
  }

  if (mealType === 'LUNCH') {
    return {
      suggestedReplacementType: 'HIGH_PROTEIN_LUNCH',
      coachingMessage:
        'Replace this with a lean protein lunch such as chicken bowl, tuna pasta salad, turkey meatballs, or beef bowl.',
    };
  }

  if (mealType === 'DINNER') {
    return {
      suggestedReplacementType: 'HIGH_PROTEIN_DINNER',
      coachingMessage:
        'Replace this with a higher-protein dinner based around chicken, lean beef, fish, turkey, or tofu.',
    };
  }

  return {
    suggestedReplacementType: 'HIGH_PROTEIN_SNACK',
    coachingMessage:
      'Replace this with a high-protein snack such as Greek yogurt, cottage cheese, tuna toast, protein pudding, or a whey-based snack.',
  };
}

function getReplacementTargetRanges(args: {
  mealType: MealSlotType;
  currentCalories: number;
  targetProteinPer100Kcal: number;
}): {
  targetCaloriesRange: { min: number; max: number };
  targetProteinRange: { min: number; max: number };
} {
  const profile =
    args.mealType === 'BREAKFAST'
      ? { minCalories: 250, rangeBoost: 100, spread: 1.5 }
      : args.mealType === 'LUNCH'
        ? { minCalories: 350, rangeBoost: 130, spread: 1.6 }
        : args.mealType === 'DINNER'
          ? { minCalories: 400, rangeBoost: 140, spread: 1.6 }
          : { minCalories: 150, rangeBoost: 90, spread: 1.4 };

  const minCalories = Math.max(profile.minCalories, round0(args.currentCalories * 0.85));
  const maxCalories = Math.max(minCalories + profile.rangeBoost, round0(args.currentCalories * 1.15));
  const minProtein = Math.max(15, round0((minCalories * args.targetProteinPer100Kcal) / 100));
  const maxProtein = Math.max(minProtein + 8, round0((maxCalories * (args.targetProteinPer100Kcal + profile.spread)) / 100));

  return {
    targetCaloriesRange: { min: minCalories, max: maxCalories },
    targetProteinRange: { min: minProtein, max: maxProtein },
  };
}

function buildReplacementOpportunities(args: {
  assignments: Array<{
    assignmentId: string;
    mealName: string;
    mealType: MealSlotType;
    dayOfWeek: number;
    portion: number;
    meal: MealMacros;
    analysis: MealAnalysis;
  }>;
  dailyProteinGap: number;
}): ReplacementOpportunityAnalysis[] {
  const weakCandidates = args.assignments
    .map(item => {
      const calories = round0(item.meal.calories * item.portion);
      const protein = round0(item.meal.protein * item.portion);
      const proteinPer100Kcal = calories > 0 ? round1((protein / calories) * 100) : 0;
      const proteinDensityRatio = item.analysis.threshold > 0 ? proteinPer100Kcal / item.analysis.threshold : 0;
      const coachingProfile = getReplacementCoachingProfile(item.mealType);
      const targetProteinPer100Kcal = item.analysis.threshold;
      const ranges = getReplacementTargetRanges({
        mealType: item.mealType,
        currentCalories: calories,
        targetProteinPer100Kcal,
      });
      const suitabilityScore = round1(Math.max(0, proteinDensityRatio * 100));
      const priority = calculateReplacementOpportunityPriority({
        analysis: item.analysis,
        proteinDensityRatio,
      });
      const contributionToRemainingProteinGap = round1(Math.min(Math.max(0, args.dailyProteinGap), protein));
      const currentProtein = protein;
      const estimatedProteinIncrease = {
        min: round0(Math.max(0, ranges.targetProteinRange.min - currentProtein)),
        max: round0(Math.max(0, ranges.targetProteinRange.max - currentProtein)),
      };

      let reason = '';
      if (item.analysis.suitabilityStatus === 'poor') {
        reason = 'Low protein efficiency is making it hard to close the protein gap.';
      } else {
        reason = 'Borderline protein efficiency may be limiting progress toward the target.';
      }

      return {
        assignmentId: item.assignmentId,
        mealName: item.mealName,
        mealType: item.mealType,
        dayOfWeek: item.dayOfWeek,
        calories,
        protein,
        currentProtein,
        proteinPer100Kcal,
        targetProteinPer100Kcal,
        targetCaloriesRange: ranges.targetCaloriesRange,
        targetProteinRange: ranges.targetProteinRange,
        suggestedReplacementType: coachingProfile.suggestedReplacementType,
        coachingMessage: coachingProfile.coachingMessage,
        estimatedProteinIncrease,
        suitabilityStatus: item.analysis.suitabilityStatus,
        suitabilityScore,
        priority,
        contributionToRemainingProteinGap,
        reason,
      } satisfies ReplacementOpportunityAnalysis;
    })
    .filter(opportunity => opportunity.suitabilityStatus !== 'good')
    .sort((left, right) => {
      if (left.proteinPer100Kcal !== right.proteinPer100Kcal) {
        return left.proteinPer100Kcal - right.proteinPer100Kcal;
      }
      if (left.priority !== right.priority) {
        const priorityRank: Record<'high' | 'medium' | 'low', number> = { high: 0, medium: 1, low: 2 };
        return priorityRank[left.priority] - priorityRank[right.priority];
      }
      return right.protein - left.protein;
    });

  return weakCandidates;
}

export function isMealSlotType(value: string): value is MealSlotType {
  return (MEAL_SLOT_ORDER as readonly string[]).includes(value);
}

export function getPortionBounds(mealType: MealSlotType): { min: number; max: number } {
  return mealType === 'SNACK' ? SNACK_PORTION_BOUNDS : DEFAULT_PORTION_BOUNDS;
}

export function clampPortion(value: number, mealType: MealSlotType): { value: number; clamped: boolean } {
  const bounds = getPortionBounds(mealType);
  if (value < bounds.min) return { value: bounds.min, clamped: true };
  if (value > bounds.max) return { value: bounds.max, clamped: true };
  return { value, clamped: false };
}

export function scaleTargets(targets: RecalculationMacroTargets, factor: number): RecalculationMacroTargets {
  return {
    calories: round0(targets.calories * factor),
    protein: round0(targets.protein * factor),
    carbs: round0(targets.carbs * factor),
    fat: round0(targets.fat * factor),
  };
}

export function divideTargets(targets: RecalculationMacroTargets, divisor: number): RecalculationMacroTargets {
  const safeDivisor = Math.max(1, divisor);
  return {
    calories: round0(targets.calories / safeDivisor),
    protein: round0(targets.protein / safeDivisor),
    carbs: round0(targets.carbs / safeDivisor),
    fat: round0(targets.fat / safeDivisor),
  };
}

export function splitDailyTargetsBySlot(targets: RecalculationMacroTargets): Record<MealSlotType, RecalculationMacroTargets> {
  const result = {} as Record<MealSlotType, RecalculationMacroTargets>;
  let remainingCalories = targets.calories;
  let remainingProtein = targets.protein;
  let remainingCarbs = targets.carbs;
  let remainingFat = targets.fat;

  MEAL_SLOT_ORDER.forEach((mealType, index) => {
    const isLast = index === MEAL_SLOT_ORDER.length - 1;
    const split = SLOT_TARGET_SPLITS[mealType];

    const calories = isLast ? remainingCalories : round0(targets.calories * split);
    const protein = isLast ? remainingProtein : round0(targets.protein * split);
    const carbs = isLast ? remainingCarbs : round0(targets.carbs * split);
    const fat = isLast ? remainingFat : round0(targets.fat * split);

    result[mealType] = { calories, protein, carbs, fat };

    remainingCalories -= calories;
    remainingProtein -= protein;
    remainingCarbs -= carbs;
    remainingFat -= fat;
  });

  return result;
}

export function calculateTotals(
  assignments: Array<{ portion: number; meal: MealMacros }>,
): RecalculationMacroTargets {
  const totals = assignments.reduce(
    (acc, assignment) => {
      acc.calories += assignment.meal.calories * assignment.portion;
      acc.protein += assignment.meal.protein * assignment.portion;
      acc.carbs += assignment.meal.carbs * assignment.portion;
      acc.fat += assignment.meal.fat * assignment.portion;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
  };
}

export function calculateAccuracyPercent(targetCalories: number, projectedCalories: number): number {
  if (targetCalories <= 0) return 0;
  const diff = Math.abs(targetCalories - projectedCalories);
  const accuracy = 100 - (diff / targetCalories) * 100;
  return round1(Math.max(0, Math.min(100, accuracy)));
}

function calculateMacroObjective(targets: RecalculationMacroTargets, totals: RecalculationMacroTargets): number {
  const caloriePenalty = (Math.abs(targets.calories - totals.calories) / Math.max(1, targets.calories)) * 450;
  const proteinDeficit = Math.max(0, targets.protein - totals.protein);
  const proteinPenalty = proteinDeficit * 3.5;

  const fatDelta = totals.fat - targets.fat;
  const fatPenalty = Math.abs(fatDelta) * 1.2 + (fatDelta > 0 ? fatDelta * 0.9 : 0);

  const carbPenalty = Math.abs(targets.carbs - totals.carbs) * 0.8;

  return caloriePenalty + proteinPenalty + fatPenalty + carbPenalty;
}

function calculateFlexibleSnackTargets(args: {
  dailyTargets: RecalculationMacroTargets;
  projectedMainMealDailyTotals: RecalculationMacroTargets;
}): RecalculationMacroTargets {
  return {
    calories: Math.max(0, args.dailyTargets.calories - args.projectedMainMealDailyTotals.calories),
    protein: Math.max(0, args.dailyTargets.protein - args.projectedMainMealDailyTotals.protein),
    carbs: Math.max(0, args.dailyTargets.carbs - args.projectedMainMealDailyTotals.carbs),
    fat: Math.max(0, args.dailyTargets.fat - args.projectedMainMealDailyTotals.fat),
  };
}

function calculateProteinDensityPreference(args: {
  analysis: MealAnalysis;
  currentPortion: number;
  candidatePortion: number;
  proteinDeficit: number;
}): number {
  const increase = Math.max(0, args.candidatePortion - args.currentPortion);
  if (increase <= 0 || args.proteinDeficit <= 0) return 0;

  const densityFactor = args.analysis.threshold > 0 ? args.analysis.proteinPer100Kcal / args.analysis.threshold : 0;
  const qualityWeight =
    args.analysis.suitabilityStatus === 'good' ? 1.2 : args.analysis.suitabilityStatus === 'borderline' ? 0.45 : -0.8;

  return increase * args.proteinDeficit * densityFactor * qualityWeight * 0.1;
}

function calculateGlobalOptimizationScore(args: {
  slotTargets: RecalculationMacroTargets;
  globalTargets: RecalculationMacroTargets;
  totals: RecalculationMacroTargets;
  underGlobalDeficit: boolean;
}): number {
  const slotScore = calculateMacroObjective(args.slotTargets, args.totals);
  const globalScore = calculateMacroObjective(args.globalTargets, args.totals);
  const globalWeight = args.underGlobalDeficit ? 1.45 : 0.25;

  return slotScore + globalScore * globalWeight;
}

function calculateUpwardMealPreference(args: {
  analysis: MealAnalysis;
  mealType: MealSlotType;
  currentPortion: number;
  candidatePortion: number;
  calorieDeficit: number;
  proteinDeficit: number;
  underGlobalDeficit: boolean;
}): number {
  const increase = Math.max(0, args.candidatePortion - args.currentPortion);
  if (increase <= 0 || !args.underGlobalDeficit) return 0;
  if (args.analysis.suitabilityStatus === 'poor') return 0;

  const densityFactor = args.analysis.threshold > 0 ? args.analysis.proteinPer100Kcal / args.analysis.threshold : 0;
  const deficitFactor =
    (args.calorieDeficit / Math.max(1, args.proteinDeficit + args.calorieDeficit)) +
    (args.proteinDeficit / Math.max(1, args.proteinDeficit + args.calorieDeficit));
  const snackBias = args.mealType === 'SNACK' ? 1.45 : 0.85;
  const qualityWeight = args.analysis.suitabilityStatus === 'good' ? 1.35 : 0.45;

  return increase * densityFactor * deficitFactor * snackBias * qualityWeight * 180;
}

export function optimizePortionsForMacros(args: {
  targets: RecalculationMacroTargets;
  globalTargets: RecalculationMacroTargets;
  preserveGoodMeals: boolean;
  minimumPortionsByAssignmentId: Map<string, number>;
  assignments: Array<{
    assignmentId: string;
    mealType: MealSlotType;
    oldPortion: number;
    meal: MealMacros;
    analysis: MealAnalysis;
  }>;
  initialNewPortions: Map<string, number>;
  maxMealAdjustments: number;
}): { optimized: Map<string, number>; adjustmentsApplied: number } {
  const step = 0.1;
  const portions = new Map(args.initialNewPortions);
  let adjustmentsApplied = 0;

  const getTotals = (candidate: Map<string, number>): RecalculationMacroTargets => {
    return calculateTotals(
      args.assignments.map(item => ({
        portion: candidate.get(item.assignmentId) ?? item.oldPortion,
        meal: item.meal,
      })),
    );
  };

  for (let i = 0; i < args.maxMealAdjustments; i += 1) {
    const currentTotals = getTotals(portions);
    const underGlobalDeficit =
      currentTotals.calories < args.globalTargets.calories || currentTotals.protein < args.globalTargets.protein;
    const currentProteinDeficit = Math.max(0, args.targets.protein - currentTotals.protein);
    const currentCalorieDeficit = Math.max(0, args.globalTargets.calories - currentTotals.calories);
    const currentGlobalProteinDeficit = Math.max(0, args.globalTargets.protein - currentTotals.protein);
    const currentScore = calculateGlobalOptimizationScore({
      slotTargets: args.targets,
      globalTargets: args.globalTargets,
      totals: currentTotals,
      underGlobalDeficit,
    });
    const orderedAssignments = [...args.assignments].sort((left, right) => {
      const rank = (analysis: MealAnalysis, mealType: MealSlotType): number => {
        if (underGlobalDeficit && analysis.suitabilityStatus === 'good' && mealType === 'SNACK') return 0;
        if (underGlobalDeficit && analysis.suitabilityStatus === 'good') return 1;
        if (analysis.suitabilityStatus === 'good') return 0;
        if (analysis.suitabilityStatus === 'borderline') return 1;
        return 2;
      };

      const leftRank = rank(left.analysis, left.mealType);
      const rightRank = rank(right.analysis, right.mealType);
      const rankDiff = leftRank - rightRank;
      if (rankDiff !== 0) return rankDiff;
      if (underGlobalDeficit && left.mealType !== right.mealType) {
        if (left.mealType === 'SNACK') return -1;
        if (right.mealType === 'SNACK') return 1;
      }
      return right.analysis.proteinPer100Kcal - left.analysis.proteinPer100Kcal;
    });

    let bestScore = currentScore;
    let bestAssignmentId: string | null = null;
    let bestPortion = 0;

    for (const item of orderedAssignments) {
      const currentPortion = portions.get(item.assignmentId) ?? item.oldPortion;
      const bounds = getPortionBounds(item.mealType);
      const candidates = [round1(currentPortion + step), round1(currentPortion - step)].filter(
        value => value >= bounds.min && value <= bounds.max,
      );

      for (const candidatePortion of candidates) {
        if (
          args.preserveGoodMeals &&
          item.analysis.suitabilityStatus === 'good' &&
          candidatePortion < (args.minimumPortionsByAssignmentId.get(item.assignmentId) ?? item.oldPortion)
        ) {
          continue;
        }

        if (
          underGlobalDeficit &&
          item.analysis.suitabilityStatus === 'good' &&
          candidatePortion < currentPortion
        ) {
          continue;
        }

        const candidateMap = new Map(portions);
        candidateMap.set(item.assignmentId, candidatePortion);
        const candidateTotals = getTotals(candidateMap);
        const candidateScore =
          calculateGlobalOptimizationScore({
            slotTargets: args.targets,
            globalTargets: args.globalTargets,
            totals: candidateTotals,
            underGlobalDeficit,
          }) -
          calculateProteinDensityPreference({
            analysis: item.analysis,
            currentPortion,
            candidatePortion,
            proteinDeficit: currentProteinDeficit,
          }) -
          calculateUpwardMealPreference({
            analysis: item.analysis,
            mealType: item.mealType,
            currentPortion,
            candidatePortion,
            calorieDeficit: currentCalorieDeficit,
            proteinDeficit: currentGlobalProteinDeficit,
            underGlobalDeficit,
          });

        if (candidateScore < bestScore - 0.01) {
          bestScore = candidateScore;
          bestAssignmentId = item.assignmentId;
          bestPortion = candidatePortion;
        }
      }
    }

    if (!bestAssignmentId) break;

    portions.set(bestAssignmentId, bestPortion);
    adjustmentsApplied += 1;
  }

  return { optimized: portions, adjustmentsApplied };
}

export function evaluateMealPlanRecalculation(input: MealPlanRecalculationComputationInput): MealPlanRecalculationComputationResult {
  const numDays = Math.max(1, input.numDays);
  const slotDailyTargets = splitDailyTargetsBySlot(input.targets);
  const mealAnalysisByAssignmentId = new Map<string, MealAnalysis>(
    input.assignments.map(item => [item.assignmentId, analyzeMeal(item.mealType, item.baseMeal)]),
  );
  const minimumPortionsByAssignmentId = new Map<string, number>(
    input.assignments.map(item => [item.assignmentId, item.logicalOldPortion]),
  );
  const baselineTotals = calculateTotals(
    input.assignments.map(item => ({
      portion: item.logicalOldPortion,
      meal: item.baseMeal,
    })),
  );
  const baselineDailyTotals = divideTargets(baselineTotals, numDays);
  const preserveGoodMeals =
    baselineDailyTotals.calories < input.targets.calories || baselineDailyTotals.protein < input.targets.protein;
  const slotCoverage = new Map<MealSlotType, Set<number>>(
    MEAL_SLOT_ORDER.map(mealType => [mealType, new Set<number>()]),
  );

  for (const item of input.assignments) {
    slotCoverage.get(item.mealType)?.add(item.dayOfWeek);
  }

  const coverageDaysBySlot = new Map<MealSlotType, number>(
    MEAL_SLOT_ORDER.map(mealType => [mealType, slotCoverage.get(mealType)?.size ?? 0]),
  );

  const slotPlanTargets = new Map<MealSlotType, RecalculationMacroTargets>();
  for (const mealType of MAIN_MEAL_TYPES) {
    const coverageDays = coverageDaysBySlot.get(mealType) ?? 0;
    slotPlanTargets.set(mealType, coverageDays > 0 ? scaleTargets(slotDailyTargets[mealType], coverageDays) : zeroTargets());
  }
  slotPlanTargets.set('SNACK', zeroTargets());

  const initialPortionsByAssignmentId = new Map<string, number>();
  const clampedByAssignmentId = new Map<string, boolean>();

  for (const mealType of MAIN_MEAL_TYPES) {
    const slotItems = input.assignments.filter(item => item.mealType === mealType);
    if (slotItems.length === 0) {
      continue;
    }

    const coverageDays = coverageDaysBySlot.get(mealType) ?? 0;
    const slotCurrentTotals = calculateTotals(
      slotItems.map(item => ({ portion: item.logicalOldPortion, meal: item.baseMeal })),
    );
    const targetTotals = slotPlanTargets.get(mealType) ?? zeroTargets();
    const scaleFactor = slotCurrentTotals.calories > 0 ? targetTotals.calories / slotCurrentTotals.calories : 1;

    for (const item of slotItems) {
      const analysis = mealAnalysisByAssignmentId.get(item.assignmentId) ?? analyzeMeal(mealType, item.baseMeal);
      const scaled = round1(item.logicalOldPortion * scaleFactor);
      const adjustedPortion =
        preserveGoodMeals && analysis.suitabilityStatus === 'good' && scaled < item.logicalOldPortion
          ? Math.max(item.logicalOldPortion, 1.0)
          : scaled;
      const clamped = clampPortion(adjustedPortion, mealType);
      initialPortionsByAssignmentId.set(item.assignmentId, clamped.value);
      clampedByAssignmentId.set(item.assignmentId, clamped.clamped);
    }

  }

  let optimizedPortions = new Map(initialPortionsByAssignmentId);
  let adjustmentsApplied = 0;

  if (input.optimizationMode === 'macro_optimized') {
    for (const mealType of MAIN_MEAL_TYPES) {
      const slotItems = input.assignments.filter(item => item.mealType === mealType);
      if (slotItems.length === 0) {
        continue;
      }

      const optimized = optimizePortionsForMacros({
        targets: slotPlanTargets.get(mealType) ?? zeroTargets(),
        globalTargets: input.targets,
        preserveGoodMeals,
        minimumPortionsByAssignmentId,
        assignments: slotItems.map(item => ({
          assignmentId: item.assignmentId,
          mealType,
          oldPortion: item.logicalOldPortion,
          meal: item.baseMeal,
          analysis: mealAnalysisByAssignmentId.get(item.assignmentId) ?? analyzeMeal(mealType, item.baseMeal),
        })),
        initialNewPortions: optimizedPortions,
        maxMealAdjustments: input.maxMealAdjustments,
      });

      optimizedPortions = optimized.optimized;
      adjustmentsApplied += optimized.adjustmentsApplied;
    }

  }

  const projectedMainMealTotals = calculateTotals(
    input.assignments
      .filter(item => item.mealType !== 'SNACK')
      .map(item => ({
        portion: optimizedPortions.get(item.assignmentId) ?? item.logicalOldPortion,
        meal: item.baseMeal,
      })),
  );
  const projectedMainMealDailyTotals = divideTargets(projectedMainMealTotals, numDays);
  const flexibleSnackDailyTargets = calculateFlexibleSnackTargets({
    dailyTargets: input.targets,
    projectedMainMealDailyTotals,
  });
  const snackCoverageDays = coverageDaysBySlot.get('SNACK') ?? 0;
  const flexibleSnackWeeklyTargets =
    snackCoverageDays > 0 ? scaleTargets(flexibleSnackDailyTargets, snackCoverageDays) : zeroTargets();
  slotPlanTargets.set('SNACK', flexibleSnackWeeklyTargets);

  if (input.optimizationMode === 'macro_optimized') {
    const snackItems = input.assignments.filter(item => item.mealType === 'SNACK');
    if (snackItems.length > 0) {
      const optimizedSnack = optimizePortionsForMacros({
        targets: flexibleSnackWeeklyTargets,
        globalTargets: input.targets,
        preserveGoodMeals,
        minimumPortionsByAssignmentId,
        assignments: snackItems.map(item => ({
          assignmentId: item.assignmentId,
          mealType: 'SNACK',
          oldPortion: item.logicalOldPortion,
          meal: item.baseMeal,
          analysis: mealAnalysisByAssignmentId.get(item.assignmentId) ?? analyzeMeal('SNACK', item.baseMeal),
        })),
        initialNewPortions: optimizedPortions,
        maxMealAdjustments: input.maxMealAdjustments,
      });

      optimizedPortions = optimizedSnack.optimized;
      adjustmentsApplied += optimizedSnack.adjustmentsApplied;
    }
  }

  const deltas = input.assignments
    .map(item => {
      const nextPortion = optimizedPortions.get(item.assignmentId) ?? item.logicalOldPortion;
      return {
        assignmentId: item.assignmentId,
        mealName: item.mealName,
        mealType: item.mealType,
        dayOfWeek: item.dayOfWeek,
        oldPortion: item.logicalOldPortion,
        newPortion: nextPortion,
        wasClampedByBounds:
          clampedByAssignmentId.get(item.assignmentId) === true ||
          nextPortion <= getPortionBounds(item.mealType).min + 0.0001 ||
          nextPortion >= getPortionBounds(item.mealType).max - 0.0001,
      } satisfies MealPortionDelta;
    })
    .sort((left, right) => {
      const mealTypeDiff = MEAL_SLOT_ORDER.indexOf(left.mealType as MealSlotType) - MEAL_SLOT_ORDER.indexOf(right.mealType as MealSlotType);
      if (mealTypeDiff !== 0) return mealTypeDiff;
      if (left.dayOfWeek !== right.dayOfWeek) return left.dayOfWeek - right.dayOfWeek;
      return left.mealName.localeCompare(right.mealName);
    });

  const projectedWeeklyTotals = calculateTotals(
    input.assignments.map(item => {
      const delta = deltas.find(candidate => candidate.assignmentId === item.assignmentId)!;
      return { portion: delta.newPortion, meal: item.baseMeal };
    }),
  );

  const slotSummaries = MEAL_SLOT_ORDER.map(mealType => {
    const slotItems = input.assignments.filter(item => item.mealType === mealType);
    const coverageDays = coverageDaysBySlot.get(mealType) ?? 0;
    const included = coverageDays > 0;
    const normalizationStatus: MealSlotNormalizationStatus =
      coverageDays === 0
        ? 'missing'
        : coverageDays === numDays
          ? 'normalized'
          : 'partially_normalized';
    const target =
      mealType === 'SNACK'
        ? flexibleSnackDailyTargets
        : coverageDays > 0
          ? slotDailyTargets[mealType]
          : zeroTargets();
    const projectedPlanTotals = calculateTotals(
      slotItems.map(item => {
        const delta = deltas.find(candidate => candidate.assignmentId === item.assignmentId);
        return {
          portion: delta?.newPortion ?? 0,
          meal: item.baseMeal,
        };
      }),
    );
    const projected = coverageDays > 0 ? divideTargets(projectedPlanTotals, coverageDays) : zeroTargets();
    const slotHasClamping = deltas.some(delta => delta.mealType === mealType && delta.wasClampedByBounds);
    const slotAnalysis = analyzeMeal(mealType, projectedPlanTotals);
    const proteinPer100Kcal = slotAnalysis.proteinPer100Kcal;
    const suitabilityStatus = slotAnalysis.suitabilityStatus;
    const suitabilityReasons = [...slotAnalysis.suitabilityReasons];
    const targetLabel = mealType === 'SNACK' ? 'Flexible top-up target' : 'Fixed slot target';
    const targetHint =
      mealType === 'SNACK'
        ? coverageDays > 0
          ? 'Used to close remaining calorie/protein gap.'
          : 'Snack target adjusted because main meals are capped.'
        : null;

    if (coverageDays > 0 && slotHasClamping) {
      suitabilityReasons.push('One or more assignments are capped at the safe upper portion limit.');
    }
    if (coverageDays === 0) {
      suitabilityReasons.push('No assignments exist for this slot.');
    } else if (coverageDays < numDays) {
      suitabilityReasons.push(`Only ${coverageDays}/${numDays} days are covered.`);
    }

    let warning: string | null = null;
    let expectedAccuracyPercent: number | null = null;

    if (coverageDays === 0) {
      warning = `Missing: 0/${numDays} days covered.`;
    } else {
      expectedAccuracyPercent = calculateAccuracyPercent(target.calories, projected.calories);
      if (coverageDays < numDays) {
        warning = `Partially normalized: ${coverageDays}/${numDays} days covered.`;
      }
      if (slotHasClamping || expectedAccuracyPercent < 99) {
        warning = warning
          ? `${warning} Could not hit target exactly within safe portion limits.`
          : `Could not hit target exactly within safe portion limits.`;
      }
    }

    return {
      mealType,
      included,
      normalizationStatus,
      coverageDays,
      expectedDays: numDays,
      target,
      projected,
      targetLabel,
      targetHint,
      proteinPer100Kcal,
      suitabilityStatus,
      suitabilityReasons,
      expectedAccuracyPercent,
      hasBoundsClamping: slotHasClamping,
      warning,
    } satisfies MealSlotSummary;
  });

  const projectedDailyTotals = divideTargets(projectedWeeklyTotals, numDays);
  const replacementOpportunities = buildReplacementOpportunities({
    assignments: input.assignments.map(item => {
      const delta = deltas.find(candidate => candidate.assignmentId === item.assignmentId)!;
      return {
        assignmentId: item.assignmentId,
        mealName: item.mealName,
        mealType: item.mealType,
        dayOfWeek: item.dayOfWeek,
        portion: delta.newPortion,
        meal: item.baseMeal,
        analysis: mealAnalysisByAssignmentId.get(item.assignmentId) ?? analyzeMeal(item.mealType, item.baseMeal),
      };
    }),
    dailyProteinGap: Math.max(0, input.targets.protein - projectedDailyTotals.protein),
  });
  const weeklyTargetTotals = {
    calories: input.targets.calories * numDays,
    protein: input.targets.protein * numDays,
    carbs: input.targets.carbs * numDays,
    fat: input.targets.fat * numDays,
  };
  const dailyGaps = getMissingDailyGaps(input.targets, projectedDailyTotals);
  const expectedAccuracyPercent = calculateAccuracyPercent(weeklyTargetTotals.calories, projectedWeeklyTotals.calories);
  const proteinGapPercent =
    weeklyTargetTotals.protein > 0
      ? Math.max(0, ((weeklyTargetTotals.protein - projectedWeeklyTotals.protein) / weeklyTargetTotals.protein) * 100)
      : 0;

  const missingSlots = slotSummaries.filter(summary => summary.normalizationStatus === 'missing');
  const adjustableAssignments = input.assignments.filter(item => (coverageDaysBySlot.get(item.mealType) ?? 0) > 0);
  const cappedAssignments = deltas.filter(
    delta => delta.newPortion >= getPortionBounds(delta.mealType as MealSlotType).max - 0.0001,
  );
  const cappedRatio = adjustableAssignments.length > 0 ? cappedAssignments.length / adjustableAssignments.length : 0;
  const hasMeaningfulProteinGap = dailyGaps.protein > 0;
  const hasMeaningfulCalorieGap = dailyGaps.calories > 0;

  let targetStatus: MealPlanRecalculationValidation['targetStatus'] = 'ok';
  if (missingSlots.length > 0 && (hasMeaningfulCalorieGap || hasMeaningfulProteinGap)) {
    targetStatus = 'needsAdditionalMeals';
  } else if (
    adjustableAssignments.length > 0 &&
    cappedRatio >= 0.6 &&
    (hasMeaningfulCalorieGap || hasMeaningfulProteinGap)
  ) {
    targetStatus = 'targetUnreachableWithCurrentAssignments';
  }

  const validationReasons: string[] = [];
  let summaryReason: string | null = null;
  const recommendedAdditions: MealPlanRecommendedAddition[] = [];

  if (targetStatus === 'needsAdditionalMeals') {
    const missingSlotLabel = missingSlots.map(slot => formatMealTypeLabel(slot.mealType)).join(', ');
    summaryReason = `Target cannot be reached because existing meals are already at safe maximum portions. ${missingSlotLabel ? `${missingSlotLabel} is missing from the plan. ` : ''}Add snacks or additional meal assignments.`;
  } else if (targetStatus === 'targetUnreachableWithCurrentAssignments') {
    summaryReason =
      'Target cannot be reached with the current assignments because the plan is already portion capped. Replace low-protein meals or add additional high-protein snacks.';
  }

  for (const missingSlot of missingSlots) {
    if (hasMeaningfulCalorieGap || hasMeaningfulProteinGap) {
      const daysNeeded = missingSlot.expectedDays;
      const reason =
        missingSlot.mealType === 'SNACK'
          ? 'Current meals cannot reach target within portion limits. Add 1-2 high-protein snacks per day.'
          : 'Current meals cannot reach target within portion limits. Add this meal slot back or increase meal variety.';

      recommendedAdditions.push(
        missingSlot.mealType === 'SNACK'
          ? buildSnackRecommendation({
              numDays: daysNeeded,
              dailyGaps,
              reason,
            })
          : buildAdditionalMealRecommendation({
              type: missingSlot.mealType,
              daysNeeded,
              dailyGaps,
              reason,
            }),
      );
    }
  }

  if (targetStatus === 'targetUnreachableWithCurrentAssignments' && recommendedAdditions.length === 0 && (hasMeaningfulCalorieGap || hasMeaningfulProteinGap)) {
    recommendedAdditions.push(
      buildAdditionalMealRecommendation({
        type: 'ADDITIONAL_MEAL',
        daysNeeded: numDays,
        dailyGaps,
        reason: 'Current meals are portion capped. Replace low-protein meals or add additional high-protein snacks.',
      }),
    );
  }

  if (targetStatus !== 'ok') {
    validationReasons.push(summaryReason ?? 'Target cannot be reached with the current assignments.');
  }
  if (expectedAccuracyPercent < ACCURACY_BLOCK_THRESHOLD) {
    validationReasons.push(`Calorie accuracy is ${expectedAccuracyPercent.toFixed(1)}%, below the 90% application threshold.`);
  }
  if (proteinGapPercent > PROTEIN_GAP_BLOCK_THRESHOLD) {
    validationReasons.push(
      `Protein is ${proteinGapPercent.toFixed(1)}% below target, which exceeds the 15% application threshold.`,
    );
  }

  const hasBoundsClamping = deltas.some(delta => delta.wasClampedByBounds);
  const status: MealPlanRecalculationValidation['status'] =
    validationReasons.length > 0
      ? 'blocked'
      : hasBoundsClamping || expectedAccuracyPercent < 99
        ? 'warning'
        : 'ok';

  const validation: MealPlanRecalculationValidation = {
    status,
    canApply: status !== 'blocked' && targetStatus === 'ok',
    calorieAccuracyPercent: expectedAccuracyPercent,
    proteinGapPercent: round1(proteinGapPercent),
    reasons: validationReasons,
    targetStatus,
    summaryReason,
  };

  const slotNotes = slotSummaries
    .filter(summary => summary.warning)
    .map(summary => summary.warning as string);
  const warningParts = [...slotNotes];
  if (validationReasons.length > 0) {
    warningParts.push(`Preview blocked: ${validationReasons.join(' ')}`);
  }
  if (hasBoundsClamping || expectedAccuracyPercent < 99) {
    warningParts.push(`Target cannot be reached exactly within safe portion limits. Expected overall accuracy: ${expectedAccuracyPercent.toFixed(1)}%.`);
  }

  return {
    slotSummaries,
    deltas,
    projectedWeeklyTotals,
    projectedDailyTotals,
    expectedAccuracyPercent,
    hasBoundsClamping,
    adjustmentsApplied,
    recommendedAdditions,
    replacementOpportunities,
    warning: warningParts.length > 0 ? warningParts.join(' ') : null,
    validation,
  };
}
