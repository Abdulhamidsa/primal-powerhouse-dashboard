import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function HomePage() {
  const h = await headers();
  const host = (h.get('host') ?? '').toLowerCase();

  // admin host -> admin login, otherwise app login
  if (host.startsWith('admin.')) {
    redirect('/login');
  }

  redirect('/login');
}
