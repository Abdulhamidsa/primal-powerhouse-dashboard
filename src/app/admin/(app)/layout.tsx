import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_AUTH_COOKIE_NAME, AUTH_COOKIE_NAME, AuthService } from '@/lib/auth';
import AdminShell from './ClientShell';

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(ADMIN_AUTH_COOKIE_NAME)?.value;
  const legacyToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  const adminPayload = adminToken ? AuthService.verifyToken(adminToken) : null;
  const legacyPayload = legacyToken ? AuthService.verifyToken(legacyToken) : null;
  const payload = adminPayload ?? legacyPayload;

  if (!payload || payload.type !== 'admin') {
    redirect('/admin/login');
  }

  return <AdminShell userId={payload.userId}>{children}</AdminShell>;
}
