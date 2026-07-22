import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/lib/AuthContext';
import { notificationsApi } from '@/lib/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function NotificationRegistrar() {
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token || Platform.OS === 'web' || !Device.isDevice) return;
    let active = true;

    void (async () => {
      try {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Nearbuy',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }
        const current = await Notifications.getPermissionsAsync();
        const permission = current.granted
          ? current
          : await Notifications.requestPermissionsAsync();
        if (!permission.granted || !active) return;

        const projectId =
          Constants.easConfig?.projectId ??
          (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId;
        if (!projectId) return;
        const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        if (active) await notificationsApi.registerPushToken(token, pushToken, Platform.OS);
      } catch (error) {
        // Expo Go on recent Android SDKs cannot register for remote push. The
        // persisted in-app notification inbox still works without a dev build.
        console.info(
          'Push registration unavailable:',
          error instanceof Error ? error.message : error
        );
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = response.notification.request.content.data?.route;
      if (typeof route === 'string' && route.startsWith('/')) router.push(route as never);
    });
    return () => subscription.remove();
  }, [router]);

  return null;
}
