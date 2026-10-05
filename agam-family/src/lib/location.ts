import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { AGAM_LOCATION_TASK } from '../tasks/locationTask';
import { sendLocation } from './api';

export type ProtectionStatus = {
  servicesEnabled: boolean;
  foreground: Location.PermissionStatus | 'undetermined';
  background: Location.PermissionStatus | 'undetermined';
  backgroundAvailable: boolean;
  active: boolean;
};

async function postLocation(current: Location.LocationObject, source: 'device' | 'manual' | 'geofence' = 'manual') {
  const c = current.coords;
  try {
    await sendLocation({
      latitude: c.latitude,
      longitude: c.longitude,
      accuracyM: c.accuracy ?? undefined,
      altitudeM: c.altitude ?? undefined,
      speedMps: c.speed ?? undefined,
      recordedAt: new Date(current.timestamp).toISOString(),
      source,
    });
  } catch {}
  return current;
}

export async function shareCurrentLocationOnce() {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return { ok: false as const, reason: 'foreground_denied' as const };
  const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  await postLocation(current, 'manual');
  return { ok: true as const, location: current };
}

export async function sendCurrentLocation(source: 'manual' | 'device' | 'geofence' = 'manual') {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') throw new Error('FOREGROUND_LOCATION_DENIED');
  const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  await postLocation(current, source);
  return current;
}

export async function enableFamilyLocationSharing() {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) return { ok: false as const, reason: 'services_disabled' as const };
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return { ok: false as const, reason: 'foreground_denied' as const };
  if (Platform.OS === 'web') return { ok: true as const, background: false };

  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') return { ok: false as const, reason: 'background_denied' as const };

  const already = await Location.hasStartedLocationUpdatesAsync(AGAM_LOCATION_TASK);
  if (!already) {
    await Location.startLocationUpdatesAsync(AGAM_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 75,
      timeInterval: 60_000,
      deferredUpdatesDistance: 150,
      deferredUpdatesInterval: 90_000,
      pausesUpdatesAutomatically: true,
      showsBackgroundLocationIndicator: true,
      activityType: Location.ActivityType.OtherNavigation,
      foregroundService: Platform.OS === 'android' ? {
        notificationTitle: 'AGAM Family — location sharing active',
        notificationBody: 'Your location is being shared with your approved family circle.',
        notificationColor: '#0A8CFF',
        killServiceOnDestroy: false,
      } : undefined,
    });
  }
  return { ok: true as const, background: true };
}

export async function enableFamilyProtection() {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) throw new Error('LOCATION_SERVICES_DISABLED');
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') throw new Error('FOREGROUND_LOCATION_DENIED');
  if (Platform.OS === 'web') return { foreground: true, background: false };
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status === 'granted') {
    const result = await enableFamilyLocationSharing();
    return { foreground: true, background: result.ok === true };
  }
  return { foreground: true, background: false };
}

export async function disableFamilyLocationSharing() {
  if (Platform.OS === 'web') return;
  const started = await Location.hasStartedLocationUpdatesAsync(AGAM_LOCATION_TASK);
  if (started) await Location.stopLocationUpdatesAsync(AGAM_LOCATION_TASK);
}

export const disableFamilyProtection = disableFamilyLocationSharing;

export async function isFamilyLocationSharingEnabled() {
  if (Platform.OS === 'web') return false;
  try { return await Location.hasStartedLocationUpdatesAsync(AGAM_LOCATION_TASK); }
  catch { return false; }
}

export async function getProtectionStatus(): Promise<ProtectionStatus> {
  const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => false);
  const fg = await Location.getForegroundPermissionsAsync().catch(() => ({ status: 'undetermined' as const }));
  const bg = Platform.OS === 'web'
    ? { status: 'undetermined' as const }
    : await Location.getBackgroundPermissionsAsync().catch(() => ({ status: 'undetermined' as const }));
  const active = await isFamilyLocationSharingEnabled();
  return {
    servicesEnabled,
    foreground: fg.status,
    background: bg.status,
    backgroundAvailable: Platform.OS !== 'web',
    active,
  };
}
