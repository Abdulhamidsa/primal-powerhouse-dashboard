import { httpClient } from '@/lib/http/client';
import type {
  IngredientMacroRefreshRequest,
  IngredientMacroRefreshPreviewResponse,
  IngredientMacroRefreshStartedResponse,
  IngredientMacroRefreshStatusResponse,
} from '@/features/ingredient-macro-refresh/types/refresh.types';

export async function previewIngredientMacroRefresh(
  payload: Omit<IngredientMacroRefreshRequest, 'confirm'>
): Promise<IngredientMacroRefreshPreviewResponse> {
  return httpClient.post<IngredientMacroRefreshPreviewResponse>('/api/admin/ingredient-macro-refresh', {
    ...payload,
    confirm: false,
  });
}

export async function startIngredientMacroRefresh(
  payload: Omit<IngredientMacroRefreshRequest, 'confirm'>
): Promise<IngredientMacroRefreshStartedResponse> {
  return httpClient.post<IngredientMacroRefreshStartedResponse>('/api/admin/ingredient-macro-refresh', {
    ...payload,
    confirm: true,
  });
}

export async function getIngredientMacroRefreshStatus(jobId: string): Promise<IngredientMacroRefreshStatusResponse> {
  return httpClient.get<IngredientMacroRefreshStatusResponse>(
    `/api/admin/ingredient-macro-refresh/${encodeURIComponent(jobId)}`
  );
}
