import { Redirect } from 'expo-router';
import { Button, Card, Copy, Field, Screen, Status } from '@/components/ui';
import { useAuth, useLogin } from '../hooks/useAuth';
export default function LoginScreen() {
  const auth = useAuth(); const form = useLogin();
  if (auth.session) return <Redirect href="/" />;
  return <Screen title="Primal Powerhouse" subtitle="Your coaching, every day."><Card><Copy>Welcome back</Copy><Field label="Email" value={form.email} onChange={form.setEmail} /><Field label="Password" value={form.password} onChange={form.setPassword} secure /><Status error={form.error} /><Button title={form.pending ? 'Signing in…' : 'Sign in'} onPress={form.submit} disabled={form.pending} /><Copy muted>Use the account provided by your coach. Contact your coach if you need help signing in.</Copy></Card></Screen>;
}
