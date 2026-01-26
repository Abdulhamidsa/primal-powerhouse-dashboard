import { useEffect } from 'react';

/**
 * Hook that automatically refreshes the auth token periodically
 * to maintain persistent login in PWA
 * Refreshes every 6 hours to keep the 30-day expiry active
 */
export function useAuthRefresh() {
  useEffect(() => {
    // Only refresh on client-side and in browser environment
    if (typeof window === 'undefined') return;

    // Function to refresh token
    const refreshToken = async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          console.log('[AUTH] Token refreshed successfully');
        } else if (response.status === 401) {
          // Token is no longer valid, user needs to login again
          console.warn('[AUTH] Token refresh failed - user needs to login');
          try {
            localStorage.removeItem('userType');
          } catch {}
          // Do not redirect here; allow middleware/page guards to handle it
        }
      } catch (error) {
        console.error('[AUTH] Token refresh error:', error);
      }
    };

    // Refresh immediately on mount (in case token was about to expire)
    refreshToken();

    // Then refresh every 6 hours to avoid hitting expiry windows
    const intervalId = setInterval(refreshToken, 6 * 60 * 60 * 1000);

    // Also refresh when page becomes visible (user returns from inactive tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[AUTH] Page became visible - refreshing token');
        refreshToken();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
