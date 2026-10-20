import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_AUTH_COOKIE_NAME, AUTH_COOKIE_NAME, AuthService } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { accentThemeIdSchema, appearanceModeSchema } from '@primal/theme';
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

  const admin = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { themePreference: true, appearanceMode: true },
  });

  const accentTheme = accentThemeIdSchema.safeParse(admin?.themePreference).data ?? 'ocean';
  const mode = appearanceModeSchema.safeParse(admin?.appearanceMode).data ?? 'dark';

  return <AdminShell userId={payload.userId} initialAppearance={{ mode, accentTheme }}>{children}</AdminShell>;
}
