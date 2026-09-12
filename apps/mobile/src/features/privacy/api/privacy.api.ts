import { httpClient } from '@/lib/http/client';
import type { PrivacyCenterResponse, PrivacyConsentValues, PrivacyExportCreateResponse } from '../types/privacy.types';
export const getPrivacy = () => httpClient.get<PrivacyCenterResponse>('/api/privacy/center');
export const updateConsent = (input: PrivacyConsentValues) => httpClient.send('/api/privacy/consent', 'PUT', input);
export const requestExport = () => httpClient.send<PrivacyExportCreateResponse>('/api/privacy/export', 'POST', {});
export const downloadExport = (path: string) => httpClient.get<unknown>(path);
export const deleteAccount = (input: unknown) => httpClient.send('/api/privacy/delete', 'POST', input);
export const revokeSessions = () => httpClient.send('/api/privacy/sessions', 'POST', { action: 'logout_all' });
