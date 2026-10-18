import { AuthShell } from '@/features/self-signup/components/AuthShell';
import { SignupForm } from '@/features/self-signup/components/SignupForm';

export default function SignupPage() {
  return <AuthShell title="Create your account"><SignupForm /></AuthShell>;
}
