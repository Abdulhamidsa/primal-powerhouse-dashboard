'use client';

import { useMemo, useState } from 'react';
import { useSWRConfig } from 'swr';
import {
  buildClientDetailUrl,
  updateClientNotes,
} from '@/features/admin-clients-dashboard/api/adminClientsDashboard.api';
import type { ClientNoteEntry } from '@/features/admin-clients-dashboard/types/adminClientsDashboard.types';

function toTimestampLabel(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function parseLine(line: string, index: number): ClientNoteEntry {
  const match = line.match(/^\[(.+?)\]\s+([^:]+):\s*(.*)$/);
  if (!match) {
    return {
      id: `line-${index}`,
      actor: 'Coach',
      timestampLabel: 'Legacy note',
      message: line,
    };
  }

  return {
    id: `line-${index}`,
    timestampLabel: match[1].trim(),
    actor: match[2].trim(),
    message: match[3].trim(),
  };
}

export function parseClientNotes(rawNotes: string | null | undefined): ClientNoteEntry[] {
  if (!rawNotes) return [];

  return rawNotes
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => parseLine(line, index));
}

export function useClientNotes(clientId: string | null, rawNotes: string | null, actorName = 'Coach') {
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const entries = useMemo(() => parseClientNotes(rawNotes), [rawNotes]);

  const addNote = async () => {
    if (!clientId) return;

    const message = draft.trim();
    if (!message) return;

    const noteLine = `[${toTimestampLabel()}] ${actorName}: ${message}`;
    const nextRaw = rawNotes?.trim() ? `${rawNotes.trim()}\n${noteLine}` : noteLine;

    setIsSaving(true);
    setError(null);

    try {
      await updateClientNotes(clientId, nextRaw);
      setDraft('');
      await mutate(buildClientDetailUrl(clientId));
      await mutate('/api/clients');
    } catch (err) {
      console.error('Failed to save note:', err);
      setError('Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    entries,
    draft,
    setDraft,
    addNote,
    isSaving,
    error,
  };
}
