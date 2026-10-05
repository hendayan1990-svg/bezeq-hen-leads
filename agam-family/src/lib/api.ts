import { getToken } from './session';

export const API_URL = String(process.env.EXPO_PUBLIC_AGAM_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  code: string;
  body: any;
  constructor(status: number, body: any) {
    const code = body?.error || `HTTP_${status}`;
    super(code);
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

export function apiConfigured() {
  return Boolean(API_URL);
}

export async function api<T = any>(path: string, init: RequestInit = {}, tokenOverride?: string | null): Promise<T> {
  if (!API_URL) throw new ApiError(503, { error: 'API_NOT_CONFIGURED' });
  const token = tokenOverride === undefined ? await getToken() : tokenOverride;
  const headers = new Headers(init.headers || {});
  if (!headers.has('content-type') && init.body) headers.set('content-type', 'application/json');
  headers.set('accept', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${API_URL}${path}`, { ...init, headers, signal: controller.signal });
    const text = await response.text();
    let body: any = null;
    if (text) {
      try { body = JSON.parse(text); } catch { body = { raw: text }; }
    }
    if (!response.ok) throw new ApiError(response.status, body);
    return body as T;
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new ApiError(408, { error: 'NETWORK_TIMEOUT' });
    if (err instanceof ApiError) throw err;
    throw new ApiError(503, { error: 'NETWORK_ERROR', message: err?.message });
  } finally {
    clearTimeout(timer);
  }
}

export async function registerParent(input: {
  email: string;
  password: string;
  displayName: string;
  familyName?: string;
  locale?: string;
}) {
  return api('/v1/auth/register-parent', { method: 'POST', body: JSON.stringify(input) }, null);
}

export async function loginParent(email: string, password: string) {
  return api('/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, null);
}

export async function createPairingCode() {
  return api<{ code: string; expiresAt: string }>('/v1/pairing/create', {
    method: 'POST', body: JSON.stringify({ role: 'child' }),
  });
}

export async function joinFamily(input: {
  code: string;
  displayName: string;
  deviceUid: string;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  deviceName?: string;
}) {
  return api('/v1/pairing/join', { method: 'POST', body: JSON.stringify(input) }, null);
}

export function getFamily() {
  return api('/v1/family');
}

export async function sendLocation(input: {
  latitude: number;
  longitude: number;
  accuracyM?: number;
  altitudeM?: number;
  speedMps?: number;
  batteryPct?: number;
  recordedAt?: string;
  source?: 'device' | 'manual' | 'geofence';
}) {
  return api('/v1/location', { method: 'POST', body: JSON.stringify(input) });
}

export async function sendSos(input: { latitude?: number; longitude?: number; batteryPct?: number; note?: string }) {
  return api('/v1/sos', { method: 'POST', body: JSON.stringify(input) });
}

export async function registerPushToken(token: string, platform: 'ios' | 'android' | 'web' | 'unknown') {
  return api('/v1/push-token', { method: 'POST', body: JSON.stringify({ token, platform }) });
}

export function getActiveSos() {
  return api<{ alerts: Array<any> }>('/v1/sos/active');
}

export function resolveSos(id: string) {
  return api(`/v1/sos/${encodeURIComponent(id)}/resolve`, { method: 'POST', body: '{}' });
}

export function sendEvent(type: string, metadata: Record<string, unknown> = {}) {
  return api('/v1/events', { method: 'POST', body: JSON.stringify({ type, metadata }) });
}

export function getPrivacyLog() {
  return api<{ events: Array<any> }>('/v1/privacy-log');
}
