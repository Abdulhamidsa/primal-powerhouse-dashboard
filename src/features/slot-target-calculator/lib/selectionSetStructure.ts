import type { MealOption, MealTypeKey } from '../../meals/types/mealSelection.types';
import { calculateMealOptionAgainstSlot, calculateSelectionSetSlotPreview } from './slotTargetCalculator';
import type {
  SlotTargetApplyMode,
  SlotTargetApplyPreview,
  SlotTargetStructureSelectionItem,
  SlotTargetStructureSummary,
  SlotTargetStructureOperation,
  MealOptionGroups,
  SlotTargetCalculatorSettings,
  SlotTargetPreview,
} from '../types/slotTargetCalculator.types';

const WEEK_DAYS = [0, 1, 2, 3, 4, 5, 6] as const;

export type StructureMealAssignment = {
  id: string;
  dayOfWeek: number;
  mealType: MealTypeKey;
  mealId: string;
  portion: number;
  meal: MealOption['meal'];
  side?: MealOption['side'] | null;
};

function normalizeMealType(value: string): MealTypeKey | null {
  const upper = value.toUpperCase();
  if (upper === 'BREAKFAST' || upper === 'LUNCH' || upper === 'DINNER' || upper === 'SNACK') {
    return upper;
  }

  return null;
}

export function buildSelectionSetOptionGroups(
  items: SlotTargetStructureSelectionItem[],
): MealOptionGroups {
  const grouped: MealOptionGroups = {
    BREAKFAST: [],
    LUNCH: [],
    DINNER: [],
    SNACK: [],
  };

  const sorted = [...items].sort((left, right) => {
    const typeDiff = left.mealType.localeCompare(right.mealType);
    if (typeDiff !== 0) return typeDiff;
    return left.slotIndex - right.slotIndex;
  });

  for (const item of sorted) {
    const mealType = normalizeMealType(item.mealType);
    if (!mealType) continue;

    grouped[mealType].push(selectionItemToMealOption(item));
  }

  return grouped;
}

export function previewApplySelectionSetStructureToMealPlan(args: {
  selectionItems: SlotTargetStructureSelectionItem[];
  currentAssignments: StructureMealAssignment[];
  settings: SlotTargetCalculatorSettings;
  applyMode: SlotTargetApplyMode;
}): SlotTargetApplyPreview & {
  calculatorPreview: SlotTargetPreview;
  operations: SlotTargetStructureOperation[];
} {
  const optionsByType = buildSelectionSetOptionGroups(args.selectionItems);
  const calculatorPreview = calculateSelectionSetSlotPreview(optionsByType, args.settings);
  const operations = planStructureOperations({
    selectionItems: args.selectionItems,
    currentAssignments: args.currentAssignments,
    calculatorPreview,
    applyMode: args.applyMode,
  });

  const summaries = buildMealTypeSummaries({
    selectionItems: args.selectionItems,
    currentAssignments: args.currentAssignments,
    operations,
    applyMode: args.applyMode,
  });

  const preview: SlotTargetApplyPreview = {
    applyMode: args.applyMode,
    affectedMealTypes: summaries
      .filter(summary => summary.optionCount > 0 && summary.plannedAssignments > 0)
      .map(summary => summary.mealType),
    assignmentsToCreate: operations.filter(operation => operation.operation === 'create').length,
    assignmentsToUpdate: operations.filter(operation => operation.operation === 'update').length,
    assignmentsToReplace: operations.filter(operation => operation.operation === 'replace').length,
    warnings: buildWarnings(args.applyMode, summaries),
    mealTypeSummaries: summaries,
  };

  return {
    ...preview,
    calculatorPreview,
    operations,
  };
}

function buildWarnings(applyMode: SlotTargetApplyMode, summaries: SlotTargetStructureSummary[]): string[] {
  const warnings: string[] = [];

  for (const summary of summaries) {
    if (summary.optionCount === 0 && summary.currentAssignments > 0) {
      warnings.push(
        `No options selected for ${summary.mealType}, existing assignments were not changed.`,
      );
    }
  }

  if (applyMode === 'UPDATE_PORTIONS_ONLY') {
    warnings.push('Apply mode only updates portions for matching meals.');
  }

  return warnings;
}

function planStructureOperations(args: {
  selectionItems: SlotTargetStructureSelectionItem[];
  currentAssignments: StructureMealAssignment[];
  calculatorPreview: SlotTargetPreview;
  applyMode: SlotTargetApplyMode;
}): SlotTargetStructureOperation[] {
  if (args.applyMode === 'UPDATE_PORTIONS_ONLY') {
    return planPortionOnlyOperations(args.currentAssignments, args.calculatorPreview, args.applyMode);
  }

  return planWeekRotationOperations(args.selectionItems, args.currentAssignments, args.calculatorPreview);
}

function planPortionOnlyOperations(
  currentAssignments: StructureMealAssignment[],
  calculatorPreview: SlotTargetPreview,
  applyMode: SlotTargetApplyMode,
): SlotTargetStructureOperation[] {
  const operations: SlotTargetStructureOperation[] = [];
  const slotTargets = calculatorPreview.slotTargets;

  for (const assignment of currentAssignments) {
    const previewItem = calculateMealOptionAgainstSlot(
      assignmentToMealOption(assignment),
      slotTargets[assignment.mealType],
      applyMode === 'UPDATE_PORTIONS_ONLY' ? 'SCALE_TO_SLOT_TARGET' : 'KEEP_PORTIONS',
    );

    operations.push({
      operation: 'update',
      dayOfWeek: assignment.dayOfWeek,
      mealType: assignment.mealType,
      mealId: assignment.mealId,
      portion: previewItem.portionMultiplier,
      existingAssignmentId: assignment.id,
      sourceSelectionItemId: assignment.id,
      slotIndex: assignment.dayOfWeek,
    });
  }

  return operations;
}

function planWeekRotationOperations(
  selectionItems: SlotTargetStructureSelectionItem[],
  currentAssignments: StructureMealAssignment[],
  calculatorPreview: SlotTargetPreview,
): SlotTargetStructureOperation[] {
  const operations: SlotTargetStructureOperation[] = [];
  const assignmentsByKey = new Map(
    currentAssignments.map(assignment => [`${assignment.dayOfWeek}:${assignment.mealType}`, assignment]),
  );
  const previewBySourceId = new Map(
    calculatorPreview.groups.flatMap(group => group.items).map(item => [item.sourceAssignmentId, item]),
  );

  const grouped = buildSelectionSetOptionGroups(selectionItems);

  for (const mealType of ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const) {
    const options = grouped[mealType];
    if (options.length === 0) continue;

    WEEK_DAYS.forEach(dayOfWeek => {
      const sourceOption = options[dayOfWeek % options.length];
      const sourceItem = selectionItems.find(item => (item.sourceAssignmentId ?? item.id) === sourceOption.sourceAssignmentId);
      const previewItem = previewBySourceId.get(sourceOption.sourceAssignmentId);
      if (!previewItem) return;

      const existing = assignmentsByKey.get(`${dayOfWeek}:${mealType}`);
      if (existing) {
        operations.push({
          operation: existing.mealId === sourceOption.meal.id ? 'update' : 'replace',
          dayOfWeek,
          mealType,
          mealId: sourceOption.meal.id,
          portion: previewItem.portionMultiplier,
          existingAssignmentId: existing.id,
          sourceSelectionItemId: sourceOption.sourceAssignmentId,
          slotIndex: sourceItem?.slotIndex ?? dayOfWeek,
        });
        return;
      }

      operations.push({
        operation: 'create',
        dayOfWeek,
        mealType,
        mealId: sourceOption.meal.id,
        portion: previewItem.portionMultiplier,
        sourceSelectionItemId: sourceOption.sourceAssignmentId,
        slotIndex: sourceItem?.slotIndex ?? dayOfWeek,
      });
    });
  }

  return operations;
}

function buildMealTypeSummaries(args: {
  selectionItems: SlotTargetStructureSelectionItem[];
  currentAssignments: StructureMealAssignment[];
  operations: SlotTargetStructureOperation[];
  applyMode: SlotTargetApplyMode;
}): SlotTargetStructureSummary[] {
  const currentByMealType = new Map<MealTypeKey, number>();
  const opsByMealType = new Map<MealTypeKey, SlotTargetStructureOperation[]>();
  const optionsByMealType = new Map<MealTypeKey, number>();

  const mealTypes: MealTypeKey[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

  for (const mealType of mealTypes) {
    currentByMealType.set(mealType, args.currentAssignments.filter(item => item.mealType === mealType).length);
    optionsByMealType.set(mealType, args.selectionItems.filter(item => item.mealType === mealType).length);
    opsByMealType.set(
      mealType,
      args.operations.filter(operation => operation.mealType === mealType),
    );
  }

  return mealTypes.map(mealType => {
    const operations = opsByMealType.get(mealType) ?? [];
    return {
      mealType,
      optionCount: optionsByMealType.get(mealType) ?? 0,
      currentAssignments: currentByMealType.get(mealType) ?? 0,
      plannedAssignments: operations.length,
      assignmentsToCreate: operations.filter(operation => operation.operation === 'create').length,
      assignmentsToUpdate: operations.filter(operation => operation.operation === 'update').length,
      assignmentsToReplace: operations.filter(operation => operation.operation === 'replace').length,
    };
  });
}

function selectionItemToMealOption(item: SlotTargetStructureSelectionItem): MealOption {
  return {
    sourceAssignmentId: item.sourceAssignmentId ?? item.id,
    mealType: item.mealType,
    portion: item.portion,
    scheduledTime: null,
    side: item.side ?? null,
    meal: item.meal,
  };
}

function assignmentToMealOption(assignment: StructureMealAssignment): MealOption {
  return {
    sourceAssignmentId: assignment.id,
    mealType: assignment.mealType,
    portion: assignment.portion,
    scheduledTime: null,
    side: assignment.side ?? null,
    meal: assignment.meal,
  };
}
