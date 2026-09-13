import { AuthShell } from '@/features/self-signup/components/AuthShell';
import { ForgotPasswordForm } from '@/features/self-signup/components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset password" subtitle="Enter your email and we’ll send a secure reset link.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
