'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Bell, LogOut, Mail, Smartphone, User, Ruler, Cake, Scale, MessageSquare, Camera } from 'lucide-react';
import { FeedbackModal } from '@/components/FeedbackModal';
import { SkeletonUserProfile } from '@/components/Skeletons';
import { ProfileAvatarEditModal } from '@/features/profile-avatar-edit/components/ProfileAvatarEditModal';
import UpdateAppButton from '@/components/UpdateAppButton';
import { usePushSubscription } from '@/features/client-coach-messaging/hooks/usePushSubscription';
import { usePrivacyActions, usePrivacyCenter } from '@/features/privacy/hooks/usePrivacyCenter';
import { ThemePreferenceSection } from '@/features/theme-preference/components/ThemePreferenceSection';
import { useThemePreference } from '@/features/theme-preference/hooks/useThemePreference';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age?: number | null;
  height?: number | null;
  currentWeight?: number | null;
  targetWeight?: number | null;
  avatar?: string | null;
}

function SettingsGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      {title ? (
        <p className="px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">{children}</div>
    </section>
  );
}

function StaticRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted/50">{icon}</div>

        <p className="text-sm font-medium text-foreground">{label}</p>

        <div className="min-w-0 flex-1 text-right">
          <p className="break-all text-right text-sm text-muted-foreground">{value}</p>
        </div>
      </div>

      <div className="ml-16 h-px bg-border/60" />
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  disabled,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted/50">{icon}</div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={checked}
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-accent' : 'bg-muted'
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span
          className={`absolute top-1 block h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function NotificationStatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'good' | 'warn' }) {
  const toneClassName =
    tone === 'good'
      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      : tone === 'warn'
        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        : 'bg-muted/50 text-muted-foreground border-border';

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneClassName}`}>{label}</span>;
}

export default function UserProfilePage() {
  const router = useRouter();
  const { themePreference, setThemePreference, themeOptions } = useThemePreference();
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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'basic'>('info');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });

        if (!response.ok) {
          router.push('/user/login');
          return;
        }

        const data = await response.json();
        setUserData(data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/user/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  if (isLoading) {
    return <SkeletonUserProfile />;
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/user/login';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

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

  const setupGuidance =
    installState === 'browser' && platform === 'ios'
      ? 'On iPhone, use Share > Add to Home Screen, then reopen the installed app and enable notifications there.'
      : installState === 'browser' && platform === 'android'
        ? 'On Android, install the app from your browser menu for the best chance of background notification delivery.'
        : pushStatus === 'subscribed'
          ? 'Best results come from using the installed Home Screen app with notifications allowed.'
          : 'Notifications work best when the app is installed and opened from your Home Screen.';

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md px-4 pb-10 pt-8">
        {/* iOS-ish header */}
        <div className="flex items-center gap-4 px-1 pb-6">
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-border bg-muted/30 flex-shrink-0">
            {userData?.avatar ? (
              <Image src={userData.avatar} alt={userData.name} fill className="object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <User className="h-7 w-7 text-muted-foreground" />
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsAvatarModalOpen(true)}
              className="absolute bottom-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm"
              aria-label="Edit profile picture"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold text-foreground">{userData?.name ?? 'Profile'}</h1>
            <p className="text-sm text-muted-foreground">
              {userData?.email
                ? userData.email.length > 25
                  ? `${userData.email.substring(0, 22)}…`
                  : userData.email
                : 'Loading…'}
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3 mb-6 px-1">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 px-4 rounded-2xl font-medium transition-all ${
              activeTab === 'info'
                ? 'bg-accent text-accent-foreground shadow-md'
                : 'bg-muted/30 text-foreground hover:bg-muted/50'
            }`}
          >
            User Info
          </button>
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-3 px-4 rounded-2xl font-medium transition-all ${
              activeTab === 'basic'
                ? 'bg-accent text-accent-foreground shadow-md'
                : 'bg-muted/30 text-foreground hover:bg-muted/50'
            }`}
          >
            Basic Info
          </button>
        </div>

        <div className="space-y-6">
          {/* User Info Tab */}
          {activeTab === 'info' && (
            <>
              <SettingsGroup title="Account">
                <StaticRow icon={<User className="h-4 w-4" />} label="Username" value={userData?.name ?? 'Loading…'} />
                <StaticRow icon={<Mail className="h-4 w-4" />} label="Email" value={userData?.email ?? 'Loading…'} />
                <div className="ml-16 h-px bg-transparent" />
              </SettingsGroup>

              <ThemePreferenceSection
                value={themePreference}
                options={themeOptions}
                onChangeAction={setThemePreference}
              />

              <SettingsGroup title="Notifications">
                <ToggleRow
                  icon={<Bell className="h-4 w-4" />}
                  label="Coach Messages"
                  description={notificationDescription}
                  checked={Boolean(privacyData?.consents.messageNotifications)}
                  disabled={
                    isPrivacyLoading ||
                    isSavingNotifications ||
                    isPushLoading ||
                    pushStatus === 'unsupported' ||
                    permissionState === 'denied'
                  }
                  onToggle={handleNotificationToggle}
                />
                <div className="px-4 pb-4">
                  <div className="ml-12 rounded-2xl bg-muted/25 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <NotificationStatusPill
                        label={pushStatus === 'subscribed' ? 'Subscribed' : pushStatus === 'denied' ? 'Blocked' : pushStatus === 'unsupported' ? 'Unsupported' : 'Not enabled'}
                        tone={pushStatus === 'subscribed' ? 'good' : pushStatus === 'denied' ? 'warn' : 'neutral'}
                      />
                      <NotificationStatusPill
                        label={installState === 'installed' ? 'Home Screen app' : 'Browser tab'}
                        tone={installState === 'installed' ? 'good' : 'neutral'}
                      />
                      <NotificationStatusPill
                        label={isServiceWorkerReady ? 'Background ready' : 'Background not ready'}
                        tone={isServiceWorkerReady ? 'good' : 'warn'}
                      />
                    </div>

                    <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                      <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <p>{setupGuidance}</p>
                    </div>

                    {errorMessage ? <p className="mt-3 text-xs text-destructive">{errorMessage}</p> : null}
                    {testFeedback ? <p className="mt-3 text-xs text-foreground">{testFeedback}</p> : null}

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={handleTestNotification}
                        disabled={isTesting || pushStatus !== 'subscribed'}
                        className="inline-flex items-center rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/35 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isTesting ? 'Sending test…' : 'Send Test Notification'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="ml-16 h-px bg-transparent" />
              </SettingsGroup>
            </>
          )}

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <>
              {userData &&
              (userData.age !== undefined ||
                userData.height !== undefined ||
                userData.currentWeight !== undefined ||
                userData.targetWeight !== undefined) ? (
                <SettingsGroup title="Body Metrics">
                  {userData.age !== undefined && (
                    <StaticRow icon={<Cake className="h-4 w-4" />} label="Age" value={`${userData.age} years`} />
                  )}
                  {userData.height !== undefined && (
                    <StaticRow icon={<Ruler className="h-4 w-4" />} label="Height" value={`${userData.height} cm`} />
                  )}
                  {(userData.currentWeight !== undefined || userData.targetWeight !== undefined) && (
                    <StaticRow
                      icon={<Scale className="h-4 w-4" />}
                      label="Weight"
                      value={
                        userData.currentWeight && userData.targetWeight
                          ? `${userData.currentWeight} → ${userData.targetWeight} kg`
                          : userData.currentWeight
                            ? `${userData.currentWeight} kg`
                            : `→ ${userData.targetWeight} kg`
                      }
                    />
                  )}
                  <div className="ml-16 h-px bg-transparent" />
                </SettingsGroup>
              ) : (
                <SettingsGroup title="Body Metrics">
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No body metrics recorded yet
                  </div>
                  <div className="ml-16 h-px bg-transparent" />
                </SettingsGroup>
              )}
            </>
          )}

          {/* Action Buttons */}

          <FeedbackModal isOpen={isFeedbackOpen} onCloseAction={() => setIsFeedbackOpen(false)} />
          <ProfileAvatarEditModal
            isOpen={isAvatarModalOpen}
            currentImageUrl={userData?.avatar ?? undefined}
            onCloseAction={() => setIsAvatarModalOpen(false)}
            onSavedAction={result => {
              setUserData(result.user);
              setIsAvatarModalOpen(false);
              window.alert('Profile picture updated successfully.');
            }}
          />
          <SettingsGroup>
            <div className="ml-16 h-px bg-border/60" />
            <UpdateAppButton />
          </SettingsGroup>
          <SettingsGroup>
            <button
              type="button"
              onClick={() => setIsFeedbackOpen(true)}
              className="w-full px-4 py-3 text-left text-sm font-semibold text-foreground hover:bg-muted/40 active:bg-muted/60"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted/50">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Send Feedback</p>
                  <p className="text-xs text-muted-foreground">Help us improve</p>
                </div>
              </div>
            </button>
            <div className="ml-16 h-px bg-border/60" />
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full px-4 py-3 text-left text-sm font-semibold text-destructive hover:bg-destructive/5 active:bg-destructive/10"
            >
              <div className="flex items-center justify-between">
                <span>Sign Out</span>
                <LogOut className="h-4 w-4" />
              </div>
            </button>
          </SettingsGroup>
        </div>
      </div>
    </div>
  );
}
