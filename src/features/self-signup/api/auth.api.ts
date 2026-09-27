import { httpClient } from '@/lib/http/client';
import type {
  AuthActionResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  SignupResponse,
  VerifyEmailResponse,
} from '../types/auth.types';

export function signup(payload: { method: 'email'; name: string; email: string; password: string } | { method: 'username'; name: string; username: string; password: string }) {
  return httpClient.post<SignupResponse>('/api/auth/user/signup', payload);
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
