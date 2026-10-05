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
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#06101D' } }} />
        </SafeAreaProvider>
      </FeedbackProvider>
    </LocaleProvider>
  );
}
