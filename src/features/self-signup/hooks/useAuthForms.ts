'use client';

import { useState } from 'react';
import {
  forgotPassword,
  resendVerification,
  resetPassword,
  signup,
  verifyEmail,
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
export const useResendVerificationAction = () => useAuthAction(resendVerification);
export const useVerifyEmailAction = () => useAuthAction(verifyEmail);
export const useForgotPasswordAction = () => useAuthAction(forgotPassword);
export const useResetPasswordAction = () => useAuthAction(resetPassword);
