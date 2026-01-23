import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthCheckOptions {
  checkAuthUrl: string;
  redirectUrl: string;
  enabled?: boolean;
}

/**
 * Hook to check if user is already authenticated
 * Should be used in layout wrappers, not in individual pages
 */
export function useAuthCheck({ checkAuthUrl, redirectUrl, enabled = true }: AuthCheckOptions) {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      setIsChecking(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const response = await fetch(checkAuthUrl, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (response.ok) {
          // User is already authenticated, redirect
          router.replace(redirectUrl);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [checkAuthUrl, redirectUrl, enabled, router]);

  return { isChecking };
}
