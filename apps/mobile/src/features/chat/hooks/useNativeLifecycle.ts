import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useSWRConfig } from 'swr';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';

import { registerPush } from '../api/chat.api';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export function useNativeLifecycle() {
  const { mutate } = useSWRConfig();
  const router = useRouter();

  useEffect(() => {
    const foreground = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void mutate(() => true);
      }
    });

    let wasOffline = false;

    const network = NetInfo.addEventListener(state => {
      if (wasOffline && state.isConnected) {
        void mutate(() => true);
      }

      wasOffline = state.isConnected === false;
    });

    if (Platform.OS === 'web') {
      return () => {
        foreground.remove();
        network();
      };
    }

    const open = (response: Notifications.NotificationResponse | null) => {
      const id = response?.notification.request.content.data?.conversationId;

      if (typeof id === 'string') {
        router.push({
          pathname: '/chat',
          params: { conversationId: id },
        });
      }
    };

    void Notifications.getLastNotificationResponseAsync().then(open);

    const received = Notifications.addNotificationReceivedListener(() => {
      void mutate(() => true);
    });

    const tapped = Notifications.addNotificationResponseReceivedListener(open);

    return () => {
      foreground.remove();
      network();
      received.remove();
      tapped.remove();
    };
  }, [mutate, router]);
}

export function usePushRegistration() {
  const [message, setMessage] = useState('');

  return {
    message,

    enable: async () => {
      try {
        if (Platform.OS === 'web') {
          throw new Error('Push notifications are only available in the mobile app.');
        }

        if (!Device.isDevice) {
          throw new Error('Notifications need a physical iPhone and a development build.');
        }

        const permission = await Notifications.requestPermissionsAsync();

        if (permission.status !== 'granted') {
          throw new Error('Notifications are disabled. Enable them in iPhone Settings.');
        }

        const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

        if (!projectId) {
          throw new Error('The Expo project must be configured before notifications can be enabled.');
        }

        const token = await Notifications.getExpoPushTokenAsync({
          projectId,
        });

        await registerPush(token.data);

        setMessage('Chat notifications enabled.');
        return true;
      } catch (e) {
        const error = e instanceof Error ? e : new Error('Unable to enable notifications');
        setMessage(error.message);
        throw error;
      }
    },
  };
}
