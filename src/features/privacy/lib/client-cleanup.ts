import { OFFLINE_METADATA_KEY } from '@/features/offline/lib/offlinePolicy';
import { SHOPPING_LIST_DRAFT_STORAGE_KEY } from '@/features/meals/utils/shoppingListStorage';

export async function clearClientLocalData(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('userType');
    localStorage.removeItem(OFFLINE_METADATA_KEY);
    localStorage.removeItem('pph_appearance_v1');
    localStorage.removeItem('pph_theme_preference');
    sessionStorage.removeItem(SHOPPING_LIST_DRAFT_STORAGE_KEY);

    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('pph_user_theme_preference:') || key.startsWith('shopping-list-checks:')) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Browser storage cleanup is best effort; the server deletion is authoritative.
  }

  document.cookie = 'pph_theme_preference=; Path=/; Max-Age=0; SameSite=Lax';
  document.cookie = 'pph_appearance_v1=; Path=/; Max-Age=0; SameSite=Lax';
  navigator.serviceWorker?.controller?.postMessage({ type: 'OFFLINE_CLEAR_USER' });

  try {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.filter((key) => key.includes('user-data') || key.includes('offline-meta')).map((key) => caches.delete(key)));
  } catch {
    // Browser cache cleanup is best effort and never controls deletion state.
  }
}
