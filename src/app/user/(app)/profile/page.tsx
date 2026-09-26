'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BellIcon as Bell, CameraIcon as Camera, CaretRightIcon as ChevronRight, KeyIcon as KeyRound, SignOutIcon as LogOut, ChatTextIcon as MessageSquare, PaletteIcon as Palette, RulerIcon as Ruler, ShieldIcon as Shield, UserIcon as User } from '@phosphor-icons/react';
import { FeedbackModal } from '@/components/FeedbackModal';
import { SkeletonUserProfile } from '@/components/Skeletons';
import UpdateAppButton from '@/components/UpdateAppButton';
import { ProfileAvatarEditModal } from '@/features/profile-avatar-edit/components/ProfileAvatarEditModal';
import { ThemePreferenceSection } from '@/features/theme-preference/components/ThemePreferenceSection';
import { useThemePreference } from '@/features/theme-preference/hooks/useThemePreference';
import { useUserLogout, useUserProfile } from '@/features/user-profile/hooks/useUserProfile';

type ProfileHubUser = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-3xl border border-border bg-card">{children}</div>;
}

function SettingsLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="flex min-h-[64px] items-center gap-3 px-4 py-3 transition-colors active:bg-muted/60">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-muted/50 text-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

export default function UserProfilePage() {
  const { themePreference, setThemePreference, themeOptions } = useThemePreference();
  const { user, error: profileError, isLoading } = useUserProfile();
  const { logout } = useUserLogout();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [userData, setUserData] = useState<ProfileHubUser | null>(user);

  useEffect(() => {
    setUserData(user);
  }, [user]);

  useEffect(() => {
    if (!profileError || profileError.status !== 401) return;
    void logout();
  }, [logout, profileError]);

  if (isLoading) return <SkeletonUserProfile />;

  const handleSignOut = async () => {
    await logout();
    window.location.href = '/user/login';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md space-y-6 px-4 pb-32">
        <div
          className="-mx-4 px-4 pb-6 pt-5"
          style={{
            background: 'radial-gradient(ellipse 150% 110% at 50% 0%, var(--color-accent-muted) 0%, transparent 72%)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[28px] border border-border bg-muted/30">
              {userData?.avatar ? (
                <Image src={userData.avatar} alt={userData.name} fill className="object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute bottom-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full border border-border bg-card text-foreground shadow-sm"
                aria-label="Edit profile picture"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Account</p>
              <h1 className="mt-1 truncate text-2xl font-semibold text-foreground">{userData?.name ?? 'Profile'}</h1>
              <p className="truncate text-sm text-muted-foreground">{userData?.email ?? 'Loading…'}</p>
            </div>
          </div>
        </div>

        <SettingsCard>
          <SettingsLink
            href="/user/settings/security"
            icon={<KeyRound className="h-4 w-4" />}
            title="Account Security"
            description="Password and login access"
          />
          <div className="ml-16 h-px bg-border/60" />
          <SettingsLink
            href="/user/settings/notifications"
            icon={<Bell className="h-4 w-4" />}
            title="Notifications"
            description="Coach message alerts and device status"
          />
          <div className="ml-16 h-px bg-border/60" />
          <SettingsLink
            href="/user/privacy"
            icon={<Shield className="h-4 w-4" />}
            title="Privacy & Data"
            description="Consent, export, sessions, and deletion"
          />
          <div className="ml-16 h-px bg-border/60" />
          <SettingsLink
            href="/user/settings/body"
            icon={<Ruler className="h-4 w-4" />}
            title="Body Metrics"
            description="Age, height, and weight targets"
          />
        </SettingsCard>

        <ThemePreferenceSection value={themePreference} options={themeOptions} onChangeAction={setThemePreference} />

        <SettingsCard>
          <button
            type="button"
            onClick={() => setIsFeedbackOpen(true)}
            className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted/60"
          >
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-muted/50">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Feedback</p>
              <p className="text-xs text-muted-foreground">Tell us what should feel better</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="ml-16 h-px bg-border/60" />
          <UpdateAppButton />
        </SettingsCard>

        <SettingsCard>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-[60px] w-full items-center justify-between px-4 py-3 text-left text-destructive transition-colors active:bg-destructive/10"
          >
            <span className="text-sm font-semibold">Sign out</span>
            <LogOut className="h-4 w-4" />
          </button>
        </SettingsCard>

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
      </div>
    </div>
  );
}
