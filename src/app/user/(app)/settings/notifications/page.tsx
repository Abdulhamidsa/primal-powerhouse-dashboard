'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BellIcon as Bell, CaretLeftIcon as ChevronLeft, DeviceMobileIcon as Smartphone } from '@phosphor-icons/react';
import { usePushSubscription } from '@/features/client-coach-messaging/hooks/usePushSubscription';
import { usePrivacyActions, usePrivacyCenter } from '@/features/privacy/hooks/usePrivacyCenter';

function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'good' | 'warn' }) {
  const toneClassName =
    tone === 'good'
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
      : tone === 'warn'
        ? 'border-amber-500/20 bg-amber-500/10 text-amber-600'
        : 'border-border bg-muted/50 text-muted-foreground';

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneClassName}`}>{label}</span>;
}

export default function UserNotificationSettingsPage() {
  const { data: privacyData, isLoading: isPrivacyLoading } = usePrivacyCenter();
  const { updateConsent } = usePrivacyActions();
  const {
    status: pushStatus,
    isLoading: isPushLoading,
    isTesting,
    subscribe,
    unsubscribe,
    testNotification,
    installState,
    platform,
    permissionState,
    isServiceWorkerReady,
    errorMessage,
  } = usePushSubscription();
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  const handleNotificationToggle = async () => {
    if (!privacyData || isSavingNotifications) return;

    const nextMessageNotifications = !privacyData.consents.messageNotifications;

    try {
      setIsSavingNotifications(true);

      if (nextMessageNotifications) {
        const ok = await subscribe();
        if (!ok) return;
      } else {
        await unsubscribe();
      }

      await updateConsent({
        ...privacyData.consents,
        messageNotifications: nextMessageNotifications,
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleTestNotification = async () => {
    setTestFeedback(null);
    const result = await testNotification();
    if (!result) {
      setTestFeedback('Test notification could not be sent. Check the setup details below and try again.');
      return;
    }

    if (result.result.status === 'sent' || result.result.status === 'partial') {
      setTestFeedback('Test notification sent. If nothing appears, check your phone notification settings and Home Screen install.');
      return;
    }

    setTestFeedback(
      result.result.reason === 'no_subscriptions'
        ? 'No active push subscription was found for this device yet.'
        : 'Test notification was skipped or failed. Please review the notification setup state below.',
    );
  };

  const notificationDescription =
    pushStatus === 'unsupported'
      ? 'This browser does not support push notifications.'
      : pushStatus === 'denied' || permissionState === 'denied'
        ? 'Notifications are blocked in your browser or system settings.'
        : pushStatus === 'subscribed'
          ? 'This device is ready for coach message alerts.'
          : installState === 'browser' && (platform === 'ios' || platform === 'android')
            ? 'Install the app to your Home Screen for better background delivery.'
            : 'Get alerted when your coach sends you a new message.';

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md space-y-6 px-4 pb-32 pt-5">
        <Link href="/user/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <ChevronLeft aria-hidden="true" focusable="false" className="h-4 w-4" />
          Profile
        </Link>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Settings</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Notifications</h1>
          <p className="mt-2 text-sm text-muted-foreground">Control coach message alerts for this device.</p>
        </div>

        <section className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-muted/50">
              <Bell aria-hidden="true" focusable="false" className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Coach Messages</p>
              <p className="text-xs text-muted-foreground">{notificationDescription}</p>
            </div>
            <button
              type="button"
              onClick={handleNotificationToggle}
              disabled={
                isPrivacyLoading ||
                isSavingNotifications ||
                isPushLoading ||
                pushStatus === 'unsupported' ||
                permissionState === 'denied'
              }
              aria-pressed={Boolean(privacyData?.consents.messageNotifications)}
              className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${
                privacyData?.consents.messageNotifications ? 'bg-accent' : 'bg-muted'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span
                className={`absolute top-1 block h-5 w-5 rounded-full bg-white transition-transform ${
                  privacyData?.consents.messageNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="border-t border-border/60 px-4 py-4">
            <div className="flex flex-wrap gap-2">
              <StatusPill
                label={
                  pushStatus === 'subscribed'
                    ? 'Subscribed'
                    : pushStatus === 'denied'
                      ? 'Blocked'
                      : pushStatus === 'unsupported'
                        ? 'Unsupported'
                        : 'Not enabled'
                }
                tone={pushStatus === 'subscribed' ? 'good' : pushStatus === 'denied' ? 'warn' : 'neutral'}
              />
              <StatusPill
                label={installState === 'installed' ? 'Home Screen app' : 'Browser tab'}
                tone={installState === 'installed' ? 'good' : 'neutral'}
              />
              <StatusPill
                label={isServiceWorkerReady ? 'Background ready' : 'Background not ready'}
                tone={isServiceWorkerReady ? 'good' : 'warn'}
              />
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-muted/25 p-3 text-xs text-muted-foreground">
              <Smartphone aria-hidden="true" focusable="false" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                {installState === 'browser' && platform === 'ios'
                  ? 'On iPhone, use Share > Add to Home Screen, then reopen the installed app and enable notifications there.'
                  : 'Notifications work best when the app is installed and opened from your Home Screen.'}
              </p>
            </div>

            {errorMessage ? <p className="mt-3 text-xs text-destructive">{errorMessage}</p> : null}
            {testFeedback ? <p className="mt-3 text-xs text-foreground">{testFeedback}</p> : null}

            <button
              type="button"
              onClick={handleTestNotification}
              disabled={isTesting || pushStatus !== 'subscribed'}
              className="mt-4 rounded-2xl border border-border px-4 py-2.5 text-xs font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isTesting ? 'Sending test…' : 'Send Test Notification'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
