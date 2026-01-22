'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogOut, Mail, User, Phone, Ruler, Cake, Scale, ChevronRight, MessageSquare } from 'lucide-react';
import { FeedbackModal } from '@/components/FeedbackModal';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  height?: number;
  currentWeight?: number;
  targetWeight?: number;
  avatar?: string;
}

type Row = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

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

function SettingsRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  const clickable = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`w-full text-left ${clickable ? 'hover:bg-muted/40 active:bg-muted/60' : ''}`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted/50">{icon}</div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {value ? <p className="truncate text-xs text-muted-foreground">{value}</p> : null}
        </div>

        {clickable ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : null}
      </div>

      {/* iOS-like separator */}
      <div className="ml-16 h-px bg-border/60" />
    </button>
  );
}

function StaticRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted/50">{icon}</div>

        <p className="text-sm font-medium text-foreground">{label}</p>

        <div className="min-w-0 flex-1 text-right">
          <p className="truncate text-sm text-muted-foreground">{value}</p>
        </div>
      </div>

      <div className="ml-16 h-px bg-border/60" />
    </div>
  );
}

export default function UserProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

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
      }
    };

    fetchUserData();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/user/login';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const rows = useMemo(() => {
    if (!userData) return { contact: [] as Row[], body: [] as Row[] };

    const contact: Row[] = [{ label: 'Email', value: userData.email, icon: <Mail className="h-4 w-4" /> }];

    if (userData.phone) {
      contact.push({
        label: 'Phone',
        value: userData.phone,
        icon: <Phone className="h-4 w-4" />,
      });
    }

    const body: Row[] = [];

    if (typeof userData.age === 'number') {
      body.push({
        label: 'Age',
        value: `${userData.age} years`,
        icon: <Cake className="h-4 w-4" />,
      });
    }

    if (typeof userData.height === 'number') {
      body.push({
        label: 'Height',
        value: `${userData.height} cm`,
        icon: <Ruler className="h-4 w-4" />,
      });
    }

    if (typeof userData.currentWeight === 'number' || typeof userData.targetWeight === 'number') {
      const cur = typeof userData.currentWeight === 'number' ? `${userData.currentWeight} kg` : '';
      const tgt = typeof userData.targetWeight === 'number' ? `${userData.targetWeight} kg` : '';
      const value = cur && tgt ? `${cur} → ${tgt}` : cur || tgt;

      body.push({
        label: 'Weight',
        value,
        icon: <Scale className="h-4 w-4" />,
      });
    }

    return { contact, body };
  }, [userData]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md px-4 pb-10 pt-8">
        {/* iOS-ish header */}
        <div className="flex items-center gap-4 px-1 pb-6">
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-border bg-muted/30">
            {userData?.avatar ? (
              <Image src={userData.avatar} alt={userData.name} fill className="object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <User className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-foreground">{userData?.name ?? 'Profile'}</h1>
            <p className="truncate text-sm text-muted-foreground">{userData?.email ?? 'Loading…'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <SettingsGroup title="Contact">
            {rows.contact.map((r, idx) => (
              <StaticRow key={`${r.label}-${idx}`} icon={r.icon} label={r.label} value={r.value} />
            ))}
            {/* remove last separator line */}
            <div className="ml-16 h-px bg-transparent" />
          </SettingsGroup>

          {rows.body.length ? (
            <SettingsGroup title="Body">
              {rows.body.map((r, idx) => (
                <StaticRow key={`${r.label}-${idx}`} icon={r.icon} label={r.label} value={r.value} />
              ))}
              <div className="ml-16 h-px bg-transparent" />
            </SettingsGroup>
          ) : null}

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
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
        </div>
      </div>
    </div>
  );
}
