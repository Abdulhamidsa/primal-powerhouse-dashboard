import { Suspense } from 'react';
import { AuthShell } from '@/features/self-signup/components/AuthShell';
import { ResetPasswordForm } from '@/features/self-signup/components/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose new password" subtitle="Set a new password for your account.">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
