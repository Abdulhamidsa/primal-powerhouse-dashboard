import { httpClient } from '@/lib/http/client';
import type {
  AuthActionResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  SignupResponse,
  VerifyEmailResponse,
} from '../types/auth.types';
import type { LegalRequirements } from '@primal/contracts/legal/types/legal.types';

export type AgePolicyResponse = { enabled: boolean; minimumAge: number | null; version: string | null };

export function signup(payload: { method: 'email'; email: string; password: string; ageDeclared?: boolean; legalAcknowledged?: boolean } | { method: 'username'; username: string; password: string; ageDeclared?: boolean; legalAcknowledged?: boolean }) {
  return httpClient.post<SignupResponse>('/api/auth/user/signup', payload);
}

export function getLegalRequirements() {
  return httpClient.get<LegalRequirements>('/api/legal/requirements');
}

export function getAgePolicy() {
  return httpClient.get<AgePolicyResponse>('/api/auth/age-policy');
}

export function suggestUsernames() {
  return httpClient.post<{ suggestions: string[] }>('/api/auth/user/username-suggestions', {});
}

export function resendVerification(payload: { email: string }) {
  return httpClient.post<AuthActionResponse>('/api/auth/user/resend-verification', payload);
}

export function verifyEmail(payload: { token: string }) {
  return httpClient.post<VerifyEmailResponse>('/api/auth/user/verify-email', payload);
}

export function forgotPassword(payload: { identifier: string }) {
  return httpClient.post<ForgotPasswordResponse>('/api/auth/user/forgot-password', payload);
}

export function resetPassword(payload: { token: string; password: string }) {
  return httpClient.post<ResetPasswordResponse>('/api/auth/user/reset-password', payload);
}
