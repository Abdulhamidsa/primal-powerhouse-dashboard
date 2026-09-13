import { AuthShell } from '@/features/self-signup/components/AuthShell';
import { SignupForm } from '@/features/self-signup/components/SignupForm';

export default function SignupPage() {
  return (
    <AuthShell title="Start free" subtitle="Create your Primal Power account.">
      <SignupForm />
    </AuthShell>
  );
}
