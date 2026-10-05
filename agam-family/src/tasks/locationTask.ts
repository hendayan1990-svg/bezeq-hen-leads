import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import type { LocationObject } from 'expo-location';
import { sendLocation } from '../lib/api';

export const AGAM_LOCATION_TASK = 'agam-family-background-location';

if (Platform.OS !== 'web' && !TaskManager.isTaskDefined(AGAM_LOCATION_TASK)) {
  TaskManager.defineTask(AGAM_LOCATION_TASK, async ({ data, error }) => {
    if (error || !data) return;
    const locations = (data as { locations?: LocationObject[] }).locations || [];
    const latest = locations.at(-1);
    if (!latest) return;
    const c = latest.coords;
    try {
      await sendLocation({
        latitude: c.latitude,
        longitude: c.longitude,
        accuracyM: c.accuracy ?? undefined,
        altitudeM: c.altitude ?? undefined,
        speedMps: c.speed ?? undefined,
        recordedAt: new Date(latest.timestamp).toISOString(),
        source: 'device',
      });
    } catch {
      // Best effort. A later update retries with fresh coordinates.
    }
  });
}
