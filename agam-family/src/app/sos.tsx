import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Card, PrimaryButton, Screen, SecondaryButton, Subtitle, Title } from '../components/BrandShell';
import { colors } from '../lib/theme';
import { getProfile } from '../lib/session';
import { apiConfigured, getActiveSos, resolveSos } from '../lib/api';

export default function SosInbox() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const profile = await getProfile();
    if (!profile) {
      router.replace('/');
      return;
    }
    if (profile.kind === 'child') {
      router.replace('/family/protection');
      return;
    }
    if (!apiConfigured()) {
      setPreview(true);
      setAlerts([{
        id: 'preview-sos',
        display_name: 'Noa',
        started_at: new Date().toISOString(),
        battery_pct: 72,
        latitude: 31.8,
        longitude: 34.65,
      }]);
      return;
    }
    try {
      const result = await getActiveSos();
      setAlerts(result.alerts || []);
    } catch {
      setError('Could not load active SOS alerts.');
    }
  }

  useEffect(() => { load(); }, []);

  async function resolve(id: string) {
    setBusyId(id);
    setError('');
    try {
      if (preview) setAlerts((x) => x.filter((a) => a.id !== id));
      else {
        await resolveSos(id);
        await load();
      }
    } catch {
      setError('Could not resolve the alert.');
    } finally {
      setBusyId(null);
    }
  }

  return <Screen>
    <BackButton onPress={() => router.back()} />
    <Title>Emergency center</Title>
    <Subtitle>Active SOS alerts from your private family circle appear here and can open directly from a safety notification.</Subtitle>

    {error ? <Text style={styles.error}>{error}</Text> : null}

    {alerts.length === 0 ? <Card style={styles.empty}>
      <Ionicons name="shield-checkmark" size={34} color={colors.green} />
      <Text style={styles.emptyTitle}>No active SOS alerts</Text>
      <Text style={styles.emptySub}>Your family emergency center is clear.</Text>
    </Card> : alerts.map((a) => <Card key={a.id} style={styles.card}>
      <View style={styles.alertHead}>
        <View style={styles.red}><Ionicons name="alert" size={25} color="white" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{a.display_name || 'Family member'}</Text>
          <Text style={styles.time}>SOS active • {new Date(a.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      </View>
      <View style={styles.meta}>
        <View style={styles.metaItem}><Ionicons name="battery-half" size={16} color={colors.green} /><Text style={styles.metaText}>{a.battery_pct ?? '—'}%</Text></View>
        <View style={styles.metaItem}><Ionicons name="location" size={16} color={colors.cyan} /><Text style={styles.metaText}>{a.latitude != null ? 'Live location received' : 'Location pending'}</Text></View>
      </View>
      <PrimaryButton label={busyId === a.id ? 'Resolving…' : 'Mark as resolved'} icon="checkmark-circle" onPress={() => resolve(a.id)} disabled={busyId === a.id} />
      <SecondaryButton label="Back to family dashboard" icon="map" onPress={() => router.replace('/demo')} />
    </Card>)}
  </Screen>;
}

const styles = StyleSheet.create({
  error: { color: '#FF9EAB', fontSize: 11 },
  empty: { alignItems: 'center', padding: 28, gap: 8 },
  emptyTitle: { color: 'white', fontSize: 18, fontWeight: '900' },
  emptySub: { color: colors.muted, fontSize: 10 },
  card: { gap: 14, borderColor: 'rgba(255,68,91,.30)' },
  alertHead: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  red: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  name: { color: 'white', fontSize: 18, fontWeight: '900' },
  time: { color: '#FFAFB9', fontSize: 10, marginTop: 3 },
  meta: { flexDirection: 'row', gap: 10 },
  metaItem: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', padding: 10, borderRadius: 13, backgroundColor: '#081A2B' },
  metaText: { color: '#C9DAE8', fontSize: 10, fontWeight: '700' },
});
