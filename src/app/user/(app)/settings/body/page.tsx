'use client';

import Link from 'next/link';
import { CakeIcon as Cake, CaretLeftIcon as ChevronLeft, RulerIcon as Ruler, ScalesIcon as Scale } from '@phosphor-icons/react';
import { SkeletonUserProfile } from '@/components/Skeletons';
import { useUserProfile } from '@/features/user-profile/hooks/useUserProfile';

function MetricRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-h-[60px] items-center gap-3 px-4 py-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-muted/50">{icon}</div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="ml-auto text-right text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

export default function UserBodySettingsPage() {
  const { user, isLoading } = useUserProfile();

  if (isLoading) return <SkeletonUserProfile />;

  const weight =
    user?.currentWeight && user?.targetWeight
      ? `${user.currentWeight} → ${user.targetWeight} kg`
      : user?.currentWeight
        ? `${user.currentWeight} kg`
        : user?.targetWeight
          ? `Target ${user.targetWeight} kg`
          : 'Not set';

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md space-y-6 px-4 pb-32 pt-5">
        <Link href="/user/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <ChevronLeft aria-hidden="true" focusable="false" className="h-4 w-4" />
          Profile
        </Link>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Settings</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Body Metrics</h1>
          <p className="mt-2 text-sm text-muted-foreground">These values are currently read-only and managed by your coach.</p>
        </div>

        <section className="overflow-hidden rounded-3xl border border-border bg-card">
          <MetricRow icon={<Cake aria-hidden="true" focusable="false" className="h-4 w-4" />} label="Age" value={user?.age ? `${user.age} years` : 'Not set'} />
          <div className="ml-16 h-px bg-border/60" />
          <MetricRow icon={<Ruler aria-hidden="true" focusable="false" className="h-4 w-4" />} label="Height" value={user?.height ? `${user.height} cm` : 'Not set'} />
          <div className="ml-16 h-px bg-border/60" />
          <MetricRow icon={<Scale aria-hidden="true" focusable="false" className="h-4 w-4" />} label="Weight" value={weight} />
        </section>
      </div>
    </div>
  );
}
