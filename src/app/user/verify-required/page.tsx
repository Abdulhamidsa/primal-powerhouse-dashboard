import { Suspense } from 'react';
import { AuthShell } from '@/features/self-signup/components/AuthShell';
import { VerifyRequiredForm } from '@/features/self-signup/components/VerifyRequiredForm';

export default function VerifyRequiredPage() {
  return (
    <AuthShell title="Check your email" subtitle="One more step before you enter the app.">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <VerifyRequiredForm />
      </Suspense>
    </AuthShell>
  );
}
