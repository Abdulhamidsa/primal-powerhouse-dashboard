'use client';

import { useState } from 'react';
import { setClientMotivationalMessage } from '@/features/admin-clients-dashboard/api/adminClientsDashboard.api';

export function useClientMotivationalMessage(clientId: string, initialMessage: string | null | undefined) {
  const [draft, setDraft] = useState(initialMessage ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!draft.trim()) {
      setError('Message cannot be empty.');
      return;
    }
    try {
      setIsSaving(true);
      setError(null);
      setSaved(false);
      await setClientMotivationalMessage(clientId, draft.trim());
      setSaved(true);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return { draft, setDraft, save, isSaving, error, saved };
}
