'use client';

import { useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { httpClient } from '@/lib/http/client';
import type { Client } from '@/lib/client-page/types';

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
  const [credentials, setCredentials] = useState<{ email: string; password: string | null } | null>(null);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [credsError, setCredsError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLoadCredentials() {
    setLoadingCreds(true);
    setCredsError(null);
    try {
      const data = await httpClient.get<{ email: string; password: string | null }>(
        `/api/clients/${encodeURIComponent(clientId)}/credentials`
      );
      setCredentials(data);
    } catch {
      setCredsError('No stored credentials found for this client.');
    } finally {
      setLoadingCreds(false);
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
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
              Goals
            </span>
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>
              {goals}
            </span>
          </div>
        )}
        {dietary && (
          <div className="col-span-2 flex flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
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

        {!credentials ? (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Stored credentials are encrypted. Click to reveal.
            </p>
            {credsError && (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {credsError}
              </p>
            )}
            <button
              type="button"
              onClick={handleLoadCredentials}
              disabled={loadingCreds}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)', border: '1px solid var(--color-accent)' }}
            >
              <KeyRound size={14} />
              {loadingCreds ? 'Loading...' : 'View Login Credentials'}
            </button>
          </div>
        ) : (
          <div
            className="rounded-lg border p-4 space-y-4"
            style={{ background: 'var(--color-bg-alt)', borderColor: 'var(--color-border)' }}
          >
            <p className="text-xs" style={{ color: 'rgb(234,179,8)' }}>
              Share securely. Do not send via unencrypted channels.
            </p>

            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Email</p>
              <p className="text-sm font-mono break-all" style={{ color: 'var(--color-text)' }}>
                {credentials.email}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Password</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono flex-1 break-all" style={{ color: 'var(--color-text)' }}>
                  {showPassword ? (credentials.password ?? '(not available)') : '••••••••••••'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="p-1.5 rounded transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setCredentials(null); setShowPassword(false); }}
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Hide
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
