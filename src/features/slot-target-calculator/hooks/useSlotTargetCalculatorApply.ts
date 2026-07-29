import { useCallback, useState } from 'react';
import type { SlotTargetCalculatorApplyRequest, SlotTargetCalculatorApplyResponse } from '../schemas/slotTargetCalculator.schema';
import { applySlotTargetStructure, previewSlotTargetStructure } from '../api/slotTargetCalculator.api';

export function useSlotTargetCalculatorApply(mealPlanId: string | null, clientId: string | null) {
  const [previewSummary, setPreviewSummary] = useState<SlotTargetCalculatorApplyResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const canRequest = Boolean(mealPlanId && clientId);

  const previewApply = useCallback(
    async (payload: Omit<SlotTargetCalculatorApplyRequest, 'mode'>) => {
      if (!mealPlanId || !clientId) return null;

      setIsPreviewing(true);
      try {
        const result = await previewSlotTargetStructure(mealPlanId, payload);
        setPreviewSummary(result);
        return result;
      } finally {
        setIsPreviewing(false);
      }
    },
    [clientId, mealPlanId],
  );

  const apply = useCallback(
    async (payload: Omit<SlotTargetCalculatorApplyRequest, 'mode'>) => {
      if (!mealPlanId || !clientId) return null;

      setIsApplying(true);
      try {
        const result = await applySlotTargetStructure(mealPlanId, payload);
        setPreviewSummary(result);
        return result;
      } finally {
        setIsApplying(false);
      }
    },
    [clientId, mealPlanId],
  );

  return {
    canRequest,
    previewSummary,
    isPreviewing,
    isApplying,
    previewApply,
    apply,
    setPreviewSummary,
  };
}
