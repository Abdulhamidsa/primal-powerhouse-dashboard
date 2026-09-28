'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DownloadIcon as Download, SignOutIcon as LogOut, TrashIcon as Trash2 } from '@phosphor-icons/react';
import { usePushSubscription } from '@/features/client-coach-messaging/hooks/usePushSubscription';
import { usePrivacyActions, usePrivacyCenter } from '@/features/privacy/hooks/usePrivacyCenter';
import { privacyDeleteRequestSchema } from '@/features/privacy/schemas/privacy.schema';
import { clearClientLocalData } from '@/features/privacy/lib/client-cleanup';
import { LegalLinks } from '@/features/legal/components/LegalLinks';

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <p className="px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="overflow-hidden rounded-3xl border border-border bg-card">{children}</div>
    </section>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
      aria-pressed={checked}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <span className={`relative inline-flex h-7 w-12 shrink-0 rounded-full ${checked ? 'bg-accent' : 'bg-muted'}`}>
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </span>
    </button>
  );
}

export function PrivacyDataCenter() {
  const router = useRouter();
  const { data, isLoading, error } = usePrivacyCenter();
  const { updateNotifications, startExport, requestDeletion, logoutAll } = usePrivacyActions();
  const { status: pushStatus, isLoading: isPushLoading, subscribe, unsubscribe } = usePushSubscription();

  const [isSavingConsent, setIsSavingConsent] = useState(false);
  const [isRequestingExport, setIsRequestingExport] = useState(false);
  const [isRequestingDeletion, setIsRequestingDeletion] = useState(false);
  const [isDeleteExpanded, setIsDeleteExpanded] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading privacy settings…</div>;
  if (error || !data) return <div className="text-sm text-destructive">Failed to load privacy settings.</div>;

  const latestJob = data.exportJobs[0] ?? null;

  const handleConsentToggle = async () => {
    const next = !data.notificationPreferences.coachMessagePushEnabled;

    try {
      setIsSavingConsent(true);

      if (next) {
          const ok = await subscribe();
          if (!ok) return;
      } else {
        await unsubscribe();
      }

      await updateNotifications(next);
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
      await clearClientLocalData();
      setConfirmText('');
      window.alert('Access is removed immediately. Your account is scheduled for permanent deletion after 30 days. This deletion cannot be cancelled.');
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
      <SettingsGroup title="Notifications">
        <SwitchRow
          label="Message Push Notifications"
          description={
            pushStatus === 'denied'
              ? 'Permission denied in browser or system settings.'
              : pushStatus === 'unsupported'
                ? 'Not supported by this browser.'
                : 'Coach message alerts for this device.'
          }
          checked={data.notificationPreferences.coachMessagePushEnabled}
          disabled={isSavingConsent || isPushLoading || pushStatus === 'unsupported' || pushStatus === 'denied'}
          onToggle={handleConsentToggle}
        />
        <p className="px-4 pb-4 text-xs text-muted-foreground">
          Analytics, marketing, and optional tracking are not active features in this app.
        </p>
      </SettingsGroup>

      <SettingsGroup title="Legal & transparency">
        <div className="space-y-3 px-4 py-4">
          <LegalLinks />
          <p className="text-xs leading-5 text-muted-foreground">
            Approved documents, consent history, processor purposes, retention categories, AI-assisted features, and storage classifications are summarized in the linked documents. Vendor regions, contractual status, transfer mechanisms, and backup deletion remain deployment- and legal-review dependent.
          </p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>{data.disclosures.retention.localPostgresBackups}</p>
            <p>{data.disclosures.retention.offServerDisasterRecovery}</p>
            <p>{data.disclosures.retention.providerRetention}</p>
            <p>{data.disclosures.reviewNotice}</p>
            <div className="space-y-1 pt-1">
              <p className="font-semibold text-foreground">Service purposes</p>
              {data.disclosures.providers.map(provider => (
                <p key={provider.name}>{provider.name}: {provider.purpose}</p>
              ))}
            </div>
          </div>
          {data.legalDocuments.length ? (
            <div className="space-y-1 text-xs text-muted-foreground">
              {data.legalDocuments.map(document => (
                <p key={`${document.type}:${document.version}`}>
                  {document.title} · v{document.version}{document.effectiveDate ? ` · effective ${new Date(document.effectiveDate).toLocaleDateString()}` : ''}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No approved legal versions are active yet.</p>
          )}
        </div>
      </SettingsGroup>

      <SettingsGroup title="Data">
        <button
          type="button"
          onClick={handleExport}
          disabled={isRequestingExport}
          className="flex min-h-[68px] w-full items-center gap-3 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-muted/50">
            <Download aria-hidden="true" focusable="false" className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Export My Data</p>
            <p className="text-xs text-muted-foreground">
              {latestJob
                ? `Last export: ${new Date(latestJob.requestedAt).toLocaleDateString()} · ${latestJob.status}`
                : 'Download your personal data archive.'}
            </p>
          </div>
          <span className="rounded-full bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground">
            {isRequestingExport ? 'Preparing…' : 'Create'}
          </span>
        </button>
      </SettingsGroup>

      <SettingsGroup title="Sessions">
        <button
          type="button"
          onClick={handleLogoutAll}
          disabled={isLoggingOutAll}
          className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
        >
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-muted/50">
            <LogOut aria-hidden="true" focusable="false" className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Logout All Sessions</p>
            <p className="text-xs text-muted-foreground">Sign out everywhere and revoke active sessions.</p>
          </div>
        </button>
      </SettingsGroup>

      <SettingsGroup title="Danger zone">
        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <Trash2 aria-hidden="true" focusable="false" className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Delete Account</p>
              {data.activeDeletionRequest ? (
                <>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Requested {new Date(data.activeDeletionRequest.requestedAt).toLocaleDateString()} · scheduled deletion{' '}
                    {new Date(data.activeDeletionRequest.scheduledHardDeleteAt).toLocaleDateString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">This deletion cannot be cancelled.</p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Access is removed immediately. Your account is scheduled for permanent deletion after 30 days. This
                    deletion cannot be cancelled.
                  </p>

                  {!isDeleteExpanded ? (
                    <button
                      type="button"
                      onClick={() => setIsDeleteExpanded(true)}
                      className="mt-3 rounded-2xl border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive"
                    >
                      Delete account
                    </button>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <input
                        value={confirmText}
                        onChange={event => setConfirmText(event.target.value)}
                        placeholder="Type DELETE MY ACCOUNT"
                        className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleDeleteRequest}
                          disabled={isRequestingDeletion || confirmText !== 'DELETE MY ACCOUNT'}
                          className="rounded-2xl bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isRequestingDeletion ? 'Deleting…' : 'Confirm deletion'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsDeleteExpanded(false);
                            setConfirmText('');
                          }}
                          className="rounded-2xl border border-border px-3 py-2 text-xs font-semibold text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </SettingsGroup>
    </div>
  );
}
