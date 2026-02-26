import { httpClient } from '@/lib/http/client';
import type {
  PrivacyCenterResponse,
  PrivacyConsentValues,
  PrivacyDeleteValues,
  PrivacyDeleteResponse,
  PrivacyExportCreateResponse,
} from '@/features/privacy/types/privacy.types';

export async function getPrivacyCenter(): Promise<PrivacyCenterResponse> {
  return httpClient.get<PrivacyCenterResponse>('/api/privacy/center');
}

export async function requestPrivacyExport(): Promise<PrivacyExportCreateResponse> {
  return httpClient.post<PrivacyExportCreateResponse>('/api/privacy/export', {});
}

export async function requestPrivacyDeletion(payload: PrivacyDeleteValues): Promise<PrivacyDeleteResponse> {
  return httpClient.post<PrivacyDeleteResponse>('/api/privacy/delete', payload);
}

export async function updatePrivacyConsent(payload: PrivacyConsentValues): Promise<{ success: true }> {
  return httpClient.put<{ success: true }>('/api/privacy/consent', payload);
}

export async function revokeAllSessions(): Promise<{ success: true }> {
  return httpClient.post<{ success: true }>('/api/privacy/sessions', { action: 'logout_all' });
}
