import { headers } from 'next/headers';
import AdminLoginPage from '../admin/login/page';
import UserLoginPage from '../user/login/page';

export default async function LoginPage() {
  const headersList = await headers();
  const host = headersList.get('host') ?? '';
  const isAdminHost = host.toLowerCase().startsWith('admin.');

  return isAdminHost ? <AdminLoginPage /> : <UserLoginPage />;
}
