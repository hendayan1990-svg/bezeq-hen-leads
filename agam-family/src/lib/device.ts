import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as Device from 'expo-device';

const DEVICE_KEY = 'agam.device.uid';

export async function getOrCreateDeviceUid() {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return 'web-preview';
    const stored = window.localStorage.getItem(DEVICE_KEY);
    if (stored) return stored;
    const created = Crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, created);
    return created;
  }
  const stored = await SecureStore.getItemAsync(DEVICE_KEY);
  if (stored) return stored;
  const created = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_KEY, created, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return created;
}

export function getPlatformName(): 'ios' | 'android' | 'web' | 'unknown' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'web') return 'web';
  return 'unknown';
}

export function getDeviceName() {
  return Device.deviceName || Device.modelName || undefined;
}
