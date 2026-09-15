import Link from 'next/link';
import { ChevronLeft, Shield } from 'lucide-react';
import { PrivacyDataCenter } from '@/features/privacy/components/PrivacyDataCenter';

export default function UserPrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-md space-y-6 px-4 pb-32 pt-5">
        <Link href="/user/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
          Profile
        </Link>

        <div className="rounded-3xl bg-[radial-gradient(ellipse_140%_120%_at_50%_0%,var(--color-accent-muted)_0%,transparent_70%)] p-5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-card/70 text-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Settings</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">Privacy & Data</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage consent, exports, active sessions, and account deletion.
          </p>
        </div>

        <PrivacyDataCenter />
      </div>
    </div>
  );
}
