'use client';

import { useState } from 'react';
import { KeyIcon as KeyRound, ArrowCounterClockwiseIcon as RotateCcw } from '@phosphor-icons/react';
import type { Client } from '@/lib/client-page/types';
import { ClientCredentialsModal } from '@/features/client-credentials';
import { useClientCredentials } from '@/features/client-credentials/hooks/useClientCredentials';
import { useResetClientPassword } from '@/features/client-credentials/hooks/useResetClientPassword';
import type {
  ClientCredentials,
  CredentialDisplayMode,
} from '@/features/client-credentials/types/clientCredentials.types';

type Props = {
  clientId: string;
  client: Client;
};

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: 'var(--color-text)' }}>
        {String(value)}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</div>
    </div>
  );
}

export function PersonalInfoTab({ clientId, client }: Props) {
  const [credentialModal, setCredentialModal] = useState<{
    mode: CredentialDisplayMode;
    credentials: ClientCredentials;
  } | null>(null);
  const { loadCredentials, isLoading: loadingCreds, error: credsError } = useClientCredentials(clientId);
  const { resetPassword, isLoading: resettingPassword, error: resetError } = useResetClientPassword(clientId);

  async function handleLoadCredentials() {
    const data = await loadCredentials();
    if (data) {
      setCredentialModal({
        mode: 'stored',
        credentials: data,
      });
    }
  }

  async function handleResetPassword() {
    if (!window.confirm('Reset this client password? The old password will stop working immediately.')) {
      return;
    }

    const data = await resetPassword();
    if (data) {
      setCredentialModal({
        mode: 'reset',
        credentials: data,
      });
    }
  }

  const goals = Array.isArray(client.goals) ? client.goals.join(', ') : null;
  const dietary = Array.isArray(client.dietaryRestrictions) ? client.dietaryRestrictions.join(', ') : null;

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <Section title="Basic Information">
        <InfoRow label="Full Name" value={client.name} />
        <InfoRow label="Email" value={client.email} />
        <InfoRow label="Phone" value={client.phone} />
        <InfoRow label="Age" value={client.age} />
        <InfoRow label="Gender" value={client.gender} />
        <InfoRow label="Status" value={client.status} />
      </Section>

      <Section title="Body & Health">
        <InfoRow label="Height" value={client.height ? `${client.height} cm` : null} />
        <InfoRow label="Current Weight" value={client.currentWeight ? `${client.currentWeight} kg` : null} />
        <InfoRow label="Target Weight" value={client.targetWeight ? `${client.targetWeight} kg` : null} />
        <InfoRow label="Activity Level" value={client.activityLevel} />
        <InfoRow label="Goal Calories" value={client.goalCalories} />
        {goals && (
          <div className="col-span-2 flex flex-col gap-0.5">
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Goals
            </span>
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>
              {goals}
            </span>
          </div>
        )}
        {dietary && (
          <div className="col-span-2 flex flex-col gap-0.5">
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Dietary Restrictions
            </span>
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>
              {dietary}
            </span>
          </div>
        )}
      </Section>

      {/* Credentials card */}
      <div
        className="rounded-xl border p-5"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          Login Credentials
        </h3>

        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            View stored credentials when available, or reset the password and reveal a new one once.
          </p>
          {credsError && (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {credsError}
            </p>
          )}
          {resetError && (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {resetError}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleLoadCredentials}
              disabled={loadingCreds}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{
                background: 'var(--color-accent-muted)',
                color: 'var(--color-accent)',
                border: '1px solid var(--color-accent)',
              }}
            >
              <KeyRound aria-hidden="true" focusable="false" size={14} />
              {loadingCreds ? 'Loading...' : 'View Stored Credentials'}
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resettingPassword}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{
                background: 'var(--color-bg-alt)',
                color: 'var(--color-text)',
                border: '1px solid var(--color-border)',
              }}
            >
              <RotateCcw aria-hidden="true" focusable="false" size={14} />
              {resettingPassword ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </div>

      {credentialModal ? (
        <ClientCredentialsModal
          open
          mode={credentialModal.mode}
          credentials={credentialModal.credentials}
          onCloseAction={() => {
            setCredentialModal(null);
          }}
        />
      ) : null}
    </div>
  );
}
