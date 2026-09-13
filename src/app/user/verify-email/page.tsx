import { Suspense } from 'react';
import { AuthShell } from '@/features/self-signup/components/AuthShell';
import { VerifyEmailClient } from '@/features/self-signup/components/VerifyEmailClient';

export default function VerifyEmailPage() {
  return (
    <AuthShell title="Verify email" subtitle="We are checking your secure link.">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <VerifyEmailClient />
      </Suspense>
    </AuthShell>
  );
}
