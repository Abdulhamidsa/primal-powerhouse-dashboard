import { useRouter } from 'next/navigation';

/**
 * Hook to handle logout - clears auth and localStorage
 */
export function useLogout() {
  const router = useRouter();

  const logout = async () => {
    try {
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // Clear stored user type from localStorage for PWA
      localStorage.removeItem('userType');

      // Redirect to appropriate login page
      router.push('/user/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if error
      router.push('/user/login');
    }
  };

  return { logout };
}
