'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  forgotPassword,
  resendVerification,
  resetPassword,
  signup,
  verifyEmail,
  getAgePolicy,
  getLegalRequirements,
} from '../api/auth.api';

export function useAuthAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<TResult | null>(null);

  async function run(...args: TArgs) {
    setLoading(true);
    setError('');
    try {
      const response = await action(...args);
      setResult(response);
      return response;
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Something went wrong';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { run, loading, error, result, setError };
}

export const useSignupAction = () => useAuthAction(signup);
export function useAgePolicy() {
  return useSWR('/api/auth/age-policy', getAgePolicy);
}
export function useLegalRequirements() {
  return useSWR('/api/legal/requirements', getLegalRequirements);
}
export const useResendVerificationAction = () => useAuthAction(resendVerification);
export const useVerifyEmailAction = () => useAuthAction(verifyEmail);
export const useForgotPasswordAction = () => useAuthAction(forgotPassword);
export const useResetPasswordAction = () => useAuthAction(resetPassword);
