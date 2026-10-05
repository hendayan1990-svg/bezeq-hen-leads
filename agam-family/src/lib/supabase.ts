import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = String(process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const key = String(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '').trim();

const STORAGE_PREFIX = 'agam.supabase.';

const secureStorage = {
  async getItem(storageKey: string) {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(STORAGE_PREFIX + storageKey);
    }
    return SecureStore.getItemAsync(STORAGE_PREFIX + storageKey);
  },
  async setItem(storageKey: string, value: string) {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_PREFIX + storageKey, value);
      return;
    }
    await SecureStore.setItemAsync(STORAGE_PREFIX + storageKey, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async removeItem(storageKey: string) {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_PREFIX + storageKey);
      return;
    }
    await SecureStore.deleteItemAsync(STORAGE_PREFIX + storageKey);
  },
};

export const supabaseConfigured = Boolean(url && key);

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url, key, {
      auth: {
        storage: secureStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
      realtime: {
        params: { eventsPerSecond: 8 },
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  return supabase;
}
