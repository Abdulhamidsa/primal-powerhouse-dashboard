import { httpClient } from '@/lib/http/client';
import type {
  SlotTargetCalculatorApplyRequest,
  SlotTargetCalculatorApplyResponse,
} from '../schemas/slotTargetCalculator.schema';

export async function previewSlotTargetStructure(
  mealPlanId: string,
  payload: Omit<SlotTargetCalculatorApplyRequest, 'mode'>,
) {
  return httpClient.post<SlotTargetCalculatorApplyResponse>(`/api/meal-plans/${encodeURIComponent(mealPlanId)}/slot-target-structure`, {
    ...payload,
    mode: 'preview' as const,
  });
}

export async function applySlotTargetStructure(
  mealPlanId: string,
  payload: Omit<SlotTargetCalculatorApplyRequest, 'mode'>,
) {
  return httpClient.post<SlotTargetCalculatorApplyResponse>(`/api/meal-plans/${encodeURIComponent(mealPlanId)}/slot-target-structure`, {
    ...payload,
    mode: 'apply' as const,
  });
}
