'use client';

import { useState } from 'react';
import { completeUserOnboarding } from '@/features/user-onboarding/api/userOnboarding.api';

export function useUserOnboarding() {
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function complete() {
    if (isCompleting) return;

    setIsCompleting(true);
    setError(null);
    try {
      return await completeUserOnboarding();
    } catch (caughtError) {
      const message = caughtError && typeof caughtError === 'object' && 'message' in caughtError
        ? String(caughtError.message)
        : 'Unable to save your welcome progress.';
      setError(message);
      throw caughtError;
    } finally {
      setIsCompleting(false);
    }
  }

  return { complete, error, isCompleting };
}
