import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminShell from './ClientShell';

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get('auth-token')?.value;

  if (!token) {
    redirect('/admin/login');
  }

  return <AdminShell>{children}</AdminShell>;
}
