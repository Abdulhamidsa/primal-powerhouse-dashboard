import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLoginClient from './components/AdminLoginClient';
import { ADMIN_AUTH_COOKIE_NAME, AUTH_COOKIE_NAME, AuthService } from '@/lib/auth';

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_AUTH_COOKIE_NAME)?.value;
  const legacyToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const token = adminToken ?? legacyToken;

  if (token) {
    const payload = AuthService.verifyToken(token);
    if (payload?.type === 'admin') {
      redirect('/admin/dashboard');
    }
  }

  return <AdminLoginClient />;
}
