import { describe, expect, it } from 'vitest';
import { evaluateMealPlanRecalculation } from './recalculation';

describe('evaluateMealPlanRecalculation', () => {
  it('normalizes partial slots instead of skipping them and blocks weak previews', () => {
    const assignments = [
      ...Array.from({ length: 4 }, (_, index) => ({
        assignmentId: `breakfast-${index + 1}`,
        mealName: `Breakfast ${index + 1}`,
        mealType: 'BREAKFAST' as const,
        dayOfWeek: index + 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 450, protein: 30, carbs: 40, fat: 12 },
      })),
      ...Array.from({ length: 5 }, (_, index) => ({
        assignmentId: `lunch-${index + 1}`,
        mealName: `Lunch ${index + 1}`,
        mealType: 'LUNCH' as const,
        dayOfWeek: index + 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 650, protein: 35, carbs: 60, fat: 18 },
      })),
      ...Array.from({ length: 6 }, (_, index) => ({
        assignmentId: `dinner-${index + 1}`,
        mealName: `Dinner ${index + 1}`,
        mealType: 'DINNER' as const,
        dayOfWeek: index + 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 700, protein: 45, carbs: 55, fat: 20 },
      })),
    ];

    const result = evaluateMealPlanRecalculation({
      numDays: 6,
      targets: { calories: 2496, protein: 180, carbs: 250, fat: 80 },
      assignments,
      optimizationMode: 'macro_optimized',
      maxMealAdjustments: 2,
    });

    const breakfast = result.slotSummaries.find(summary => summary.mealType === 'BREAKFAST');
    const lunch = result.slotSummaries.find(summary => summary.mealType === 'LUNCH');
    const dinner = result.slotSummaries.find(summary => summary.mealType === 'DINNER');
    const snack = result.slotSummaries.find(summary => summary.mealType === 'SNACK');

    expect(breakfast).toMatchObject({
      included: true,
      normalizationStatus: 'partially_normalized',
      coverageDays: 4,
      expectedDays: 6,
    });
    expect(breakfast?.warning).toContain('Partially normalized: 4/6 days covered');

    expect(lunch).toMatchObject({
      included: true,
      normalizationStatus: 'partially_normalized',
      coverageDays: 5,
      expectedDays: 6,
    });
    expect(lunch?.warning).toContain('Partially normalized: 5/6 days covered');

    expect(dinner).toMatchObject({
      included: true,
      normalizationStatus: 'normalized',
      coverageDays: 6,
      expectedDays: 6,
    });

    expect(snack).toMatchObject({
      included: false,
      normalizationStatus: 'missing',
      coverageDays: 0,
      expectedDays: 6,
      targetLabel: 'Flexible top-up target',
      projected: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    });
    expect(snack?.target.calories).toBeGreaterThan(0);
    expect(snack?.targetHint).toBe('Snack target adjusted because main meals are capped.');
    expect(snack?.warning).toContain('Missing: 0/6 days covered');
    expect(result.recommendedAdditions).toHaveLength(1);
    expect(result.recommendedAdditions[0]).toMatchObject({
      type: 'ADDITIONAL_MEAL',
      daysNeeded: 6,
      reason: expect.stringContaining('Current meals cannot reach target within portion limits.'),
    });
    expect(result.validation.targetStatus).toBe('needsAdditionalMeals');
    expect(result.validation.summaryReason).toContain('Add snacks or additional meal assignments');

    expect(result.deltas.some(delta => delta.mealType === 'BREAKFAST' && delta.newPortion !== delta.oldPortion)).toBe(
      true,
    );
    expect(result.deltas.some(delta => delta.mealType === 'LUNCH' && delta.newPortion !== delta.oldPortion)).toBe(true);
    expect(result.deltas.some(delta => delta.mealType === 'DINNER' && delta.newPortion !== delta.oldPortion)).toBe(
      true,
    );
    expect(result.deltas.some(delta => delta.mealType === 'SNACK')).toBe(false);

    expect(result.validation).toMatchObject({
      status: 'blocked',
      canApply: false,
    });
    expect(result.validation.calorieAccuracyPercent).toBeLessThan(90);
    expect(result.validation.proteinGapPercent).toBeGreaterThan(15);
    expect(result.warning).toContain('Preview blocked:');
    expect(result.warning).toContain('Target cannot be reached exactly within safe portion limits.');
  });

  it('marks low protein-density meals as poor', () => {
    const assignments = [
      {
        assignmentId: 'breakfast-1',
        mealName: 'Breakfast',
        mealType: 'BREAKFAST' as const,
        dayOfWeek: 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 500, protein: 18, carbs: 55, fat: 18 },
      },
      {
        assignmentId: 'lunch-1',
        mealName: 'Lunch',
        mealType: 'LUNCH' as const,
        dayOfWeek: 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 650, protein: 24, carbs: 70, fat: 22 },
      },
      {
        assignmentId: 'dinner-1',
        mealName: 'Dinner',
        mealType: 'DINNER' as const,
        dayOfWeek: 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 700, protein: 28, carbs: 65, fat: 24 },
      },
    ];

    const result = evaluateMealPlanRecalculation({
      numDays: 1,
      targets: { calories: 2200, protein: 180, carbs: 250, fat: 80 },
      assignments,
      optimizationMode: 'macro_optimized',
      maxMealAdjustments: 2,
    });

    expect(result.slotSummaries.find(summary => summary.mealType === 'BREAKFAST')?.suitabilityStatus).toBe('poor');
    expect(result.slotSummaries.find(summary => summary.mealType === 'LUNCH')?.suitabilityStatus).toBe('poor');
    expect(result.slotSummaries.find(summary => summary.mealType === 'DINNER')?.suitabilityStatus).toBe('poor');
    expect(result.slotSummaries.every(summary => summary.suitabilityReasons.length > 0)).toBe(true);
  });

  it('preserves good snacks when the global plan is still below calories and protein', () => {
    const assignments = [
      ...Array.from({ length: 4 }, (_, index) => ({
        assignmentId: `breakfast-${index + 1}`,
        mealName: `Breakfast ${index + 1}`,
        mealType: 'BREAKFAST' as const,
        dayOfWeek: index + 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 430, protein: 28, carbs: 38, fat: 11 },
      })),
      ...Array.from({ length: 5 }, (_, index) => ({
        assignmentId: `lunch-${index + 1}`,
        mealName: `Lunch ${index + 1}`,
        mealType: 'LUNCH' as const,
        dayOfWeek: index + 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 620, protein: 34, carbs: 58, fat: 16 },
      })),
      ...Array.from({ length: 6 }, (_, index) => ({
        assignmentId: `dinner-${index + 1}`,
        mealName: `Dinner ${index + 1}`,
        mealType: 'DINNER' as const,
        dayOfWeek: index + 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 660, protein: 42, carbs: 50, fat: 18 },
      })),
      ...Array.from({ length: 3 }, (_, index) => ({
        assignmentId: `snack-${index + 1}`,
        mealName: `Snack ${index + 1}`,
        mealType: 'SNACK' as const,
        dayOfWeek: index + 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 320, protein: 29, carbs: 24, fat: 10 },
      })),
    ];

    const result = evaluateMealPlanRecalculation({
      numDays: 6,
      targets: { calories: 2496, protein: 221, carbs: 250, fat: 80 },
      assignments,
      optimizationMode: 'macro_optimized',
      maxMealAdjustments: 8,
    });

    const snackDeltas = result.deltas.filter(delta => delta.mealType === 'SNACK');

    expect(result.projectedDailyTotals.calories).toBeLessThan(2496);
    expect(result.projectedDailyTotals.protein).toBeLessThan(221);
    expect(result.slotSummaries.find(summary => summary.mealType === 'SNACK')?.suitabilityStatus).toBe('good');
    expect(result.slotSummaries.find(summary => summary.mealType === 'SNACK')?.targetLabel).toBe(
      'Flexible top-up target',
    );
    expect(snackDeltas.length).toBeGreaterThan(0);
    expect(snackDeltas.every(delta => delta.newPortion >= delta.oldPortion)).toBe(true);
    expect(snackDeltas.every(delta => delta.newPortion >= 1.0)).toBe(true);
    expect(snackDeltas.some(delta => delta.newPortion > delta.oldPortion)).toBe(true);
    expect(Math.max(...snackDeltas.map(delta => delta.newPortion))).toBeGreaterThan(1.0);
  });

  it('reduces the remaining recommendation gap after preserving and scaling good snacks', () => {
    const mealPlanWithoutSnacks = [
      ...Array.from({ length: 4 }, (_, index) => ({
        assignmentId: `breakfast-${index + 1}`,
        mealName: `Breakfast ${index + 1}`,
        mealType: 'BREAKFAST' as const,
        dayOfWeek: index + 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 430, protein: 28, carbs: 38, fat: 11 },
      })),
      ...Array.from({ length: 5 }, (_, index) => ({
        assignmentId: `lunch-${index + 1}`,
        mealName: `Lunch ${index + 1}`,
        mealType: 'LUNCH' as const,
        dayOfWeek: index + 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 620, protein: 34, carbs: 58, fat: 16 },
      })),
      ...Array.from({ length: 6 }, (_, index) => ({
        assignmentId: `dinner-${index + 1}`,
        mealName: `Dinner ${index + 1}`,
        mealType: 'DINNER' as const,
        dayOfWeek: index + 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 660, protein: 42, carbs: 50, fat: 18 },
      })),
    ];

    const mealPlanWithGoodSnacks = [
      ...mealPlanWithoutSnacks,
      ...Array.from({ length: 3 }, (_, index) => ({
        assignmentId: `snack-${index + 1}`,
        mealName: `Snack ${index + 1}`,
        mealType: 'SNACK' as const,
        dayOfWeek: index + 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 320, protein: 29, carbs: 24, fat: 10 },
      })),
    ];

    const withoutSnacks = evaluateMealPlanRecalculation({
      numDays: 6,
      targets: { calories: 2496, protein: 221, carbs: 250, fat: 80 },
      assignments: mealPlanWithoutSnacks,
      optimizationMode: 'macro_optimized',
      maxMealAdjustments: 8,
    });

    const withSnacks = evaluateMealPlanRecalculation({
      numDays: 6,
      targets: { calories: 2496, protein: 221, carbs: 250, fat: 80 },
      assignments: mealPlanWithGoodSnacks,
      optimizationMode: 'macro_optimized',
      maxMealAdjustments: 8,
    });

    expect(withSnacks.projectedDailyTotals.calories).toBeGreaterThan(withoutSnacks.projectedDailyTotals.calories);
    expect(withSnacks.projectedDailyTotals.protein).toBeGreaterThan(withoutSnacks.projectedDailyTotals.protein);
    expect(withSnacks.recommendedAdditions.length).toBeLessThanOrEqual(withoutSnacks.recommendedAdditions.length);
    expect(withSnacks.recommendedAdditions[0]?.targetCaloriesPerDay.max ?? 0).toBeLessThanOrEqual(
      withoutSnacks.recommendedAdditions[0]?.targetCaloriesPerDay.max ?? Number.MAX_SAFE_INTEGER,
    );
  });

  it('ranks replacement opportunities from weakest to strongest protein efficiency', () => {
    const assignments = [
      {
        assignmentId: 'snack-1',
        mealName: 'Avocado Egg Toast with Tomato and Lemon',
        mealType: 'SNACK' as const,
        dayOfWeek: 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 260, protein: 6, carbs: 24, fat: 14 },
      },
      {
        assignmentId: 'breakfast-1',
        mealName: 'Greek Yogurt Bowl',
        mealType: 'BREAKFAST' as const,
        dayOfWeek: 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 380, protein: 16, carbs: 30, fat: 10 },
      },
      {
        assignmentId: 'lunch-1',
        mealName: 'Syrian Lentil Soup',
        mealType: 'LUNCH' as const,
        dayOfWeek: 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 520, protein: 24, carbs: 48, fat: 12 },
      },
      {
        assignmentId: 'dinner-1',
        mealName: 'Grilled Chicken Rice Bowl',
        mealType: 'DINNER' as const,
        dayOfWeek: 1,
        logicalOldPortion: 1,
        baseMeal: { calories: 620, protein: 56, carbs: 42, fat: 16 },
      },
    ];

    const result = evaluateMealPlanRecalculation({
      numDays: 1,
      targets: { calories: 2200, protein: 180, carbs: 220, fat: 70 },
      assignments,
      optimizationMode: 'macro_optimized',
      maxMealAdjustments: 4,
    });

    expect(result.replacementOpportunities.length).toBeGreaterThan(0);
    expect(result.replacementOpportunities[0].mealName).toBe('Avocado Egg Toast with Tomato and Lemon');
    expect(result.replacementOpportunities.some(opportunity => opportunity.mealName === 'Grilled Chicken Rice Bowl')).toBe(
      false,
    );
    expect(result.replacementOpportunities.every(opportunity => opportunity.suitabilityStatus !== 'good')).toBe(true);
    expect(
      result.replacementOpportunities.map(opportunity => opportunity.proteinPer100Kcal),
    ).toEqual([...result.replacementOpportunities.map(opportunity => opportunity.proteinPer100Kcal)].sort((a, b) => a - b));
    expect(
      result.replacementOpportunities.find(opportunity => opportunity.mealType === 'BREAKFAST')?.suggestedReplacementType,
    ).toBe('HIGH_PROTEIN_BREAKFAST');
    expect(result.replacementOpportunities.find(opportunity => opportunity.mealType === 'SNACK')?.suggestedReplacementType).toBe(
      'HIGH_PROTEIN_SNACK',
    );
    expect(
      result.replacementOpportunities.find(opportunity => opportunity.mealType === 'BREAKFAST')?.coachingMessage,
    ).toContain('higher-protein breakfast');
    expect(
      result.replacementOpportunities.find(opportunity => opportunity.mealType === 'SNACK')?.coachingMessage,
    ).toContain('high-protein snack');
    expect(
      result.replacementOpportunities.every(opportunity => opportunity.estimatedProteinIncrease.min > 0),
    ).toBe(true);
  });
});
