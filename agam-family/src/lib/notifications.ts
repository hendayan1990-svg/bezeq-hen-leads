import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { registerPushToken } from './api';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function configureNotifications() {
  if (Platform.OS === 'web') return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('agam-safety', {
      name: 'AGAM Safety Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 180, 250],
      lightColor: '#0A8CFF',
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

export const configureSafetyNotifications = configureNotifications;

export async function registerForPush() {
  if (Platform.OS === 'web' || !Device.isDevice) return null;
  await configureNotifications();
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return null;

  const projectId = Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;
  const result = await Notifications.getExpoPushTokenAsync({ projectId });
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'unknown';
  try { await registerPushToken(result.data, platform); } catch {}
  return result.data;
}

export function observeNotificationNavigation(onUrl: (url: string) => void) {
  if (Platform.OS === 'web') return () => {};

  let active = true;
  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (!active || !response) return;
    const url = response.notification.request.content.data?.url;
    if (typeof url === 'string') onUrl(url);
  }).catch(() => {});

  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const url = response.notification.request.content.data?.url;
    if (typeof url === 'string') onUrl(url);
  });

  return () => {
    active = false;
    subscription.remove();
  };
}
