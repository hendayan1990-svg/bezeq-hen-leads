import { getProfile, getToken } from './session';
import { requireSupabase, supabaseConfigured } from './supabase';

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

function dbError(error: any, fallback = 'CLOUD_ERROR'): never {
  const message = String(error?.message || error?.code || fallback);
  const known = [
    'AUTH_REQUIRED','PERMANENT_ACCOUNT_REQUIRED','PERMANENT_ACCOUNT_REQUIRED_FOR_GUARDIAN',
    'FORBIDDEN','INVALID_FAMILY_NAME','INVALID_ROLE','INVALID_CODE','INVALID_DISPLAY_NAME',
    'PAIRING_RATE_LIMIT','PAIRING_CODE_INVALID_OR_EXPIRED',
  ].find((code) => message.includes(code));
  throw new ApiError(400, { error: known || fallback, message });
}

export function apiConfigured() {
  return supabaseConfigured || Boolean(API_URL);
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

async function supabaseFamilyContext() {
  const client = requireSupabase();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) throw new ApiError(401, { error: 'AUTH_REQUIRED' });

  const { data: member, error: memberError } = await client
    .from('family_members')
    .select('*')
    .eq('user_id', authData.user.id)
    .eq('active', true)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (memberError) dbError(memberError, 'FAMILY_LOOKUP_FAILED');
  if (!member) throw new ApiError(404, { error: 'FAMILY_NOT_FOUND' });

  const { data: family, error: familyError } = await client
    .from('families')
    .select('*')
    .eq('id', member.family_id)
    .single();
  if (familyError) dbError(familyError, 'FAMILY_LOOKUP_FAILED');
  return { client, user: authData.user, member, family };
}

export async function registerParent(input: {
  email: string;
  password: string;
  displayName: string;
  familyName?: string;
  locale?: string;
}) {
  if (!supabaseConfigured) {
    return api('/v1/auth/register-parent', { method: 'POST', body: JSON.stringify(input) }, null);
  }

  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { display_name: input.displayName, locale: input.locale || 'en' } },
  });
  if (error) {
    if (String(error.message).toLowerCase().includes('already')) throw new ApiError(409, { error: 'EMAIL_IN_USE' });
    dbError(error, 'SIGNUP_FAILED');
  }
  if (!data.session || !data.user) throw new ApiError(202, { error: 'EMAIL_CONFIRMATION_REQUIRED' });

  const { error: profileError } = await client.from('profiles').upsert({
    user_id: data.user.id,
    display_name: input.displayName,
    locale: input.locale || 'en',
    updated_at: new Date().toISOString(),
  });
  if (profileError) dbError(profileError, 'PROFILE_CREATE_FAILED');

  const familyName = input.familyName?.trim() || `${input.displayName.trim()}'s Family`;
  const { data: familyId, error: familyRpcError } = await client.rpc('create_family', { p_name: familyName });
  if (familyRpcError) dbError(familyRpcError, 'FAMILY_CREATE_FAILED');

  const ctx = await supabaseFamilyContext();
  return {
    token: data.session.access_token,
    user: { id: data.user.id, displayName: input.displayName },
    family: ctx.family,
    member: ctx.member,
    familyId,
  };
}

export async function loginParent(email: string, password: string) {
  if (!supabaseConfigured) return api('/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, null);

  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) throw new ApiError(401, { error: 'INVALID_CREDENTIALS' });
  const ctx = await supabaseFamilyContext();
  return {
    token: data.session.access_token,
    user: { id: data.user.id, displayName: data.user.user_metadata?.display_name || ctx.member.display_name },
    family: ctx.family,
    member: ctx.member,
  };
}

export async function createPairingCode() {
  if (!supabaseConfigured) {
    return api<{ code: string; expiresAt: string }>('/v1/pairing/create', {
      method: 'POST', body: JSON.stringify({ role: 'child' }),
    });
  }

  const ctx = await supabaseFamilyContext();
  const { data, error } = await ctx.client.rpc('create_pairing_code', { p_family_id: ctx.family.id, p_role: 'child' });
  if (error) dbError(error, 'PAIRING_CREATE_FAILED');
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.code) throw new ApiError(500, { error: 'PAIRING_CREATE_FAILED' });
  return { code: String(row.code), expiresAt: String(row.expires_at) };
}

export async function joinFamily(input: {
  code: string;
  displayName: string;
  deviceUid: string;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  deviceName?: string;
}) {
  if (!supabaseConfigured) return api('/v1/pairing/join', { method: 'POST', body: JSON.stringify(input) }, null);

  const client = requireSupabase();
  let { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) {
    const { data, error } = await client.auth.signInAnonymously();
    if (error || !data.session) dbError(error, 'ANONYMOUS_SIGNIN_FAILED');
    sessionData = { session: data.session };
  }

  const { data: joined, error: joinError } = await client.rpc('join_family_with_code', {
    p_code: input.code,
    p_display_name: input.displayName,
    p_platform: input.platform,
    p_device_uid: input.deviceUid,
    p_device_name: input.deviceName || null,
  });
  if (joinError) dbError(joinError, 'PAIRING_JOIN_FAILED');

  const ctx = await supabaseFamilyContext();
  const { data: currentSession } = await client.auth.getSession();
  return {
    token: currentSession.session?.access_token || '',
    family: ctx.family,
    member: ctx.member,
    joined,
  };
}

export async function getFamily() {
  if (!supabaseConfigured) return api('/v1/family');
  const ctx = await supabaseFamilyContext();
  const { data: members, error } = await ctx.client
    .from('family_members')
    .select('*')
    .eq('family_id', ctx.family.id)
    .eq('active', true)
    .order('joined_at', { ascending: true });
  if (error) dbError(error, 'FAMILY_MEMBERS_FAILED');
  return { family: ctx.family, me: ctx.member, members: members || [] };
}

export async function sendLocation(input: {
  latitude: number;
  longitude: number;
  accuracyM?: number;
  altitudeM?: number;
  speedMps?: number;
  batteryPct?: number;
  recordedAt?: string;
  source?: 'device' | 'manual' | 'geofence' | 'sos';
}) {
  if (!supabaseConfigured) return api('/v1/location', { method: 'POST', body: JSON.stringify(input) });

  const ctx = await supabaseFamilyContext();
  const profile = await getProfile();
  const { data: device } = await ctx.client
    .from('devices')
    .select('id')
    .eq('user_id', ctx.user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await ctx.client.from('locations').insert({
    family_id: ctx.family.id,
    member_id: profile?.memberId || ctx.member.id,
    device_id: device?.id || null,
    user_id: ctx.user.id,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy_m: input.accuracyM ?? null,
    altitude_m: input.altitudeM ?? null,
    speed_mps: input.speedMps ?? null,
    recorded_at: input.recordedAt || new Date().toISOString(),
    source: input.source || 'device',
  });
  if (error) dbError(error, 'LOCATION_SEND_FAILED');
  return { ok: true };
}

export async function sendSos(input: { latitude?: number; longitude?: number; batteryPct?: number; note?: string }) {
  if (!supabaseConfigured) return api('/v1/sos', { method: 'POST', body: JSON.stringify(input) });
  const ctx = await supabaseFamilyContext();
  const { data, error } = await ctx.client.from('sos_alerts').insert({
    family_id: ctx.family.id,
    member_id: ctx.member.id,
    created_by: ctx.user.id,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    note: input.note || null,
  }).select('*').single();
  if (error) dbError(error, 'SOS_SEND_FAILED');
  return data;
}

export async function registerPushToken(token: string, platform: 'ios' | 'android' | 'web' | 'unknown') {
  if (!supabaseConfigured) return api('/v1/push-token', { method: 'POST', body: JSON.stringify({ token, platform }) });
  const client = requireSupabase();
  const { data: authData } = await client.auth.getUser();
  if (!authData.user) throw new ApiError(401, { error: 'AUTH_REQUIRED' });
  const { error } = await client.from('devices').update({ push_token: token, platform, updated_at: new Date().toISOString() }).eq('user_id', authData.user.id);
  if (error) dbError(error, 'PUSH_REGISTER_FAILED');
  return { ok: true };
}

export async function getActiveSos() {
  if (!supabaseConfigured) return api<{ alerts: Array<any> }>('/v1/sos/active');
  const ctx = await supabaseFamilyContext();
  const { data, error } = await ctx.client.from('sos_alerts').select('*').eq('family_id', ctx.family.id).in('status', ['active','acknowledged']).order('created_at', { ascending: false });
  if (error) dbError(error, 'SOS_FETCH_FAILED');
  return { alerts: data || [] };
}

export async function resolveSos(id: string) {
  if (!supabaseConfigured) return api(`/v1/sos/${encodeURIComponent(id)}/resolve`, { method: 'POST', body: '{}' });
  const ctx = await supabaseFamilyContext();
  const { data, error } = await ctx.client.from('sos_alerts').update({
    status: 'resolved', resolved_by: ctx.user.id, resolved_at: new Date().toISOString(),
  }).eq('id', id).select('*').single();
  if (error) dbError(error, 'SOS_RESOLVE_FAILED');
  return data;
}

export async function sendEvent(type: string, metadata: Record<string, unknown> = {}) {
  if (!supabaseConfigured) return api('/v1/events', { method: 'POST', body: JSON.stringify({ type, metadata }) });
  return { ok: true, queued: false };
}

export async function getPrivacyLog() {
  if (!supabaseConfigured) return api<{ events: Array<any> }>('/v1/privacy-log');
  const ctx = await supabaseFamilyContext();
  const { data, error } = await ctx.client.from('privacy_events').select('*').eq('family_id', ctx.family.id).order('created_at', { ascending: false }).limit(100);
  if (error) dbError(error, 'PRIVACY_LOG_FAILED');
  return { events: data || [] };
}
