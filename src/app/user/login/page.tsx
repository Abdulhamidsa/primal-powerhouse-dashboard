import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import UserLogin from './components/UserLoginClient';
import { AUTH_COOKIE_NAME, CLIENT_AUTH_COOKIE_NAME, AuthService } from '@/lib/auth';

export default async function LoginPage() {
  const cookieStore = await cookies();
  const clientToken = cookieStore.get(CLIENT_AUTH_COOKIE_NAME)?.value;
  const legacyToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const token = clientToken ?? legacyToken;

  if (token) {
    const payload = AuthService.verifyToken(token);
    if (payload?.type === 'client') redirect('/user/dashboard');
  }

  return <UserLogin />;
}
