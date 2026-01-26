import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthCheckOptions {
  checkAuthUrl: string;
  redirectIfAuthenticated?: string; // login → dashboard
  redirectIfUnauthenticated?: string; // protected → login
  enabled?: boolean;
}

export function useAuthCheck({
  checkAuthUrl,
  redirectIfAuthenticated,
  redirectIfUnauthenticated,
  enabled = true,
}: AuthCheckOptions) {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      setIsChecking(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await fetch(checkAuthUrl, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.ok && redirectIfAuthenticated) {
          router.replace(redirectIfAuthenticated);
          return;
        }

        if (!res.ok && redirectIfUnauthenticated) {
          router.replace(redirectIfUnauthenticated);
          return;
        }
      } catch {
        if (redirectIfUnauthenticated) {
          router.replace(redirectIfUnauthenticated);
        }
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [checkAuthUrl, redirectIfAuthenticated, redirectIfUnauthenticated, enabled, router]);

  return { isChecking };
}
