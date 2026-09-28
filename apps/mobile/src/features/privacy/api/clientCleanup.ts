import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export async function clearMobileClientData(clientId: string | null | undefined): Promise<void> {
  if (clientId) {
    try {
      const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(`primal:${clientId}:`));
      if (keys.length) await AsyncStorage.multiRemove(keys);
    } catch {
      // Local storage cleanup is best effort; the server deletion remains authoritative.
    }
  }

  if (Platform.OS !== 'web') {
    await Promise.allSettled([
      Notifications.dismissAllNotificationsAsync(),
      Notifications.setBadgeCountAsync(0),
      Notifications.unregisterForNotificationsAsync(),
    ]);
  }
}
