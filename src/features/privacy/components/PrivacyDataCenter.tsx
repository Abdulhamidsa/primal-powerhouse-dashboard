'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Download, Trash2, LogOut } from 'lucide-react';
import { usePrivacyActions, usePrivacyCenter } from '@/features/privacy/hooks/usePrivacyCenter';
import { privacyConsentSchema, privacyDeleteRequestSchema } from '@/features/privacy/schemas/privacy.schema';
import { usePushSubscription } from '@/features/client-coach-messaging/hooks/usePushSubscription';

export function PrivacyDataCenter() {
  const router = useRouter();
  const { data, isLoading, error } = usePrivacyCenter();
  const { updateConsent, startExport, requestDeletion, logoutAll } = usePrivacyActions();
  const { status: pushStatus, isLoading: isPushLoading, subscribe, unsubscribe } = usePushSubscription();

  const [isSavingConsent, setIsSavingConsent] = useState(false);
  const [isRequestingExport, setIsRequestingExport] = useState(false);
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading privacy settings...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-destructive">Failed to load privacy settings.</div>;
  }

  const latestJob = data.exportJobs[0] ?? null;

  const handleConsentToggle = async (
    key: 'analytics' | 'marketingNotifications' | 'optionalTracking' | 'messageNotifications',
  ) => {
    const next = {
      ...data.consents,
      [key]: !data.consents[key],
    };

    const parsed = privacyConsentSchema.safeParse(next);
    if (!parsed.success) return;

    try {
      setIsSavingConsent(true);

      if (key === 'messageNotifications') {
        if (parsed.data.messageNotifications) {
          const ok = await subscribe();
          if (!ok) return;
        } else {
          await unsubscribe();
        }
      }

      await updateConsent(parsed.data);
    } finally {
      setIsSavingConsent(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsRequestingExport(true);
      const result = await startExport();
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsRequestingExport(false);
    }
  };

  const handleDeleteRequest = async () => {
    const parsed = privacyDeleteRequestSchema.safeParse({ confirmText, reason: undefined });
    if (!parsed.success) {
      window.alert('Type DELETE MY ACCOUNT to continue.');
      return;
    }

    try {
      setIsRequestingDeletion(true);
      await requestDeletion(parsed.data);
      setConfirmText('');
      window.alert('Deletion request created. Your account is now deactivated.');
      router.push('/user/login');
    } finally {
      setIsRequestingDeletion(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      setIsLoggingOutAll(true);
      await logoutAll();
      window.location.href = '/user/login';
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Consent Controls</h2>
        </div>

        <div className="space-y-3">
          {[
            { key: 'analytics' as const, label: 'Analytics' },
            { key: 'marketingNotifications' as const, label: 'Marketing Notifications' },
            { key: 'optionalTracking' as const, label: 'Optional Tracking' },
          ].map(item => (
            <label key={item.key} className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground">{item.label}</span>
              <button
                type="button"
                disabled={isSavingConsent}
                onClick={() => handleConsentToggle(item.key)}
                className={`h-7 w-12 rounded-full transition-colors ${
                  data.consents[item.key] ? 'bg-accent' : 'bg-muted'
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                    data.consents[item.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          ))}

          <label className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-sm text-foreground">Message Push Notifications</span>
              {pushStatus === 'unsupported' && (
                <span className="text-xs text-muted-foreground">Not supported by your browser</span>
              )}
              {pushStatus === 'denied' && (
                <span className="text-xs text-destructive">Permission denied — enable in browser settings</span>
              )}
            </div>
            <button
              type="button"
              disabled={isSavingConsent || isPushLoading || pushStatus === 'unsupported' || pushStatus === 'denied'}
              onClick={() => handleConsentToggle('messageNotifications')}
              className={`h-7 w-12 rounded-full transition-colors ${
                data.consents.messageNotifications ? 'bg-accent' : 'bg-muted'
              } disabled:opacity-50`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                  data.consents.messageNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Export My Data</h2>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Download your personal data archive (JSON + CSV) with an expiring secure link.
        </p>

        {latestJob ? (
          <p className="text-xs text-muted-foreground mb-3">
            Last export: {new Date(latestJob.requestedAt).toLocaleString()} · {latestJob.status}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleExport}
          disabled={isRequestingExport}
          className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium"
        >
          {isRequestingExport ? 'Preparing export...' : 'Create Export'}
        </button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <LogOut className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Active Session</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Current signed-in session detected.</p>
        <button
          type="button"
          onClick={handleLogoutAll}
          disabled={isLoggingOutAll}
          className="px-4 py-2 rounded-lg border border-border text-sm font-medium"
        >
          {isLoggingOutAll ? 'Signing out...' : 'Logout All Sessions'}
        </button>
      </section>

      <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Trash2 className="w-5 h-5 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">Request Account Deletion</h2>
        </div>

        <p className="text-sm text-muted-foreground mb-2">
          Your account is deactivated immediately and scheduled for hard deletion after the grace period.
        </p>

        {data.activeDeletionRequest ? (
          <p className="text-xs text-muted-foreground mb-3">
            Deletion requested on {new Date(data.activeDeletionRequest.requestedAt).toLocaleString()} · scheduled hard
            delete: {new Date(data.activeDeletionRequest.scheduledHardDeleteAt).toLocaleDateString()}
          </p>
        ) : (
          <>
            <input
              value={confirmText}
              onChange={event => setConfirmText(event.target.value)}
              placeholder="Type DELETE MY ACCOUNT"
              className="w-full mb-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleDeleteRequest}
              disabled={isRequestingDeletion}
              className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium"
            >
              {isRequestingDeletion ? 'Submitting...' : 'Request Deletion'}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
