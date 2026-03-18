'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogOut, Mail, User, Ruler, Cake, Scale, MessageSquare, Camera } from 'lucide-react';
import { FeedbackModal } from '@/components/FeedbackModal';
import { SkeletonUserProfile } from '@/components/Skeletons';
import { ProfileAvatarEditModal } from '@/features/profile-avatar-edit/components/ProfileAvatarEditModal';
import UpdateAppButton from '@/components/UpdateAppButton';

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

export default function UserProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'basic'>('info');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
        </div>
      </div>
    </div>
  );
}
