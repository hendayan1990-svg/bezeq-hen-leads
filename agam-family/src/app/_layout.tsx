import 'react-native-gesture-handler';
import '../tasks/locationTask';
import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureNotifications, observeNotificationNavigation } from '../lib/notifications';
import { LocaleProvider } from '../lib/locale';
import { FeedbackProvider } from '../lib/feedback';

export default function RootLayout() {
  useEffect(() => {
    configureNotifications().catch(() => {});
    return observeNotificationNavigation((url) => {
      if (url.startsWith('/')) router.push(url as never);
    });
  }, []);

  return (
    <LocaleProvider>
      <FeedbackProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom', contentStyle: { backgroundColor: '#F7FBFF' } }} />
        </SafeAreaProvider>
      </FeedbackProvider>
    </LocaleProvider>
  );
}


