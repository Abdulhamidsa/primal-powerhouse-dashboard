import { useCallback, useState } from 'react';
import { logoutAdmin } from '@/features/admin-shell/api/adminShell.api';

export function useAdminLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logoutAdmin();
      window.location.href = '/admin/login';
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  return { logout, isLoggingOut };
}
