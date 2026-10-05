import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getOrCreateDeviceUid } from './device';

const TOKEN_KEY = 'agam.session.token';
const PROFILE_KEY = 'agam.session.profile';

export type SessionProfile = {
  kind: 'parent' | 'guardian' | 'child';
  displayName?: string;
  familyName?: string;
  memberId?: string;
  familyId?: string;
};

export type AgamSession = {
  kind: 'parent' | 'guardian' | 'child' | 'user' | 'device' | 'demo-parent' | 'demo-child';
  token?: string;
  role?: 'parent' | 'guardian' | 'child';
  displayName?: string;
  memberName?: string;
  familyName?: string;
  memberId?: string;
  familyId?: string;
};

async function getValue(key: string) {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setValue(key: string, value: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function removeValue(key: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function getToken() {
  return getValue(TOKEN_KEY);
}

export async function saveSession(token: string, profile: SessionProfile): Promise<void>;
export async function saveSession(session: AgamSession): Promise<void>;
export async function saveSession(tokenOrSession: string | AgamSession, profile?: SessionProfile) {
  const legacy = typeof tokenOrSession !== 'string' ? tokenOrSession : null;
  const token = typeof tokenOrSession === 'string' ? tokenOrSession : (legacy?.token || '');
  const stored: AgamSession = legacy || {
    kind: profile?.kind || 'parent',
    token,
    role: profile?.kind,
    displayName: profile?.displayName,
    memberName: profile?.displayName,
    familyName: profile?.familyName,
    memberId: profile?.memberId,
    familyId: profile?.familyId,
  };
  if (token) await setValue(TOKEN_KEY, token);
  else await removeValue(TOKEN_KEY);
  await setValue(PROFILE_KEY, JSON.stringify(stored));
}

export async function getSession(): Promise<AgamSession | null> {
  const raw = await getValue(PROFILE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AgamSession;
    const token = await getToken();
    if (token && !parsed.token) parsed.token = token;
    return parsed;
  } catch {
    return null;
  }
}

export async function getProfile(): Promise<SessionProfile | null> {
  const session = await getSession();
  if (!session) return null;
  const kind = session.kind === 'demo-parent' || session.kind === 'user' ? 'parent'
    : session.kind === 'demo-child' || session.kind === 'device' ? 'child'
    : session.kind;
  return {
    kind: kind as SessionProfile['kind'],
    displayName: session.displayName || session.memberName,
    familyName: session.familyName,
    memberId: session.memberId,
    familyId: session.familyId,
  };
}

export async function clearSession() {
  await Promise.all([removeValue(TOKEN_KEY), removeValue(PROFILE_KEY)]);
}

export async function getDeviceUid() {
  return getOrCreateDeviceUid();
}
