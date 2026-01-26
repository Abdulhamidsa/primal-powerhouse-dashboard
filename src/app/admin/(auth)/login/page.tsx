import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLoginClient from './components/AdminLoginClient';
import { AuthService, AUTH_COOKIE_NAME } from '@/lib/auth';

export default async function AdminLoginPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    const payload = AuthService.verifyToken(token);
    if (payload?.type === 'admin') {
      redirect('/admin/dashboard');
    }
  }

  return <AdminLoginClient />;
}
