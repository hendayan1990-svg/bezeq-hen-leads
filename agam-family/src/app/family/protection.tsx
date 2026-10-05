import React, { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, FeatureRow, Kicker, Logo, PrimaryButton, Screen, SecondaryButton, Subtitle, Title } from '../../components/BrandShell';
import { colors } from '../../lib/theme';
import { clearSession, getProfile } from '../../lib/session';
import {
  disableFamilyLocationSharing,
  enableFamilyLocationSharing,
  isFamilyLocationSharingEnabled,
  shareCurrentLocationOnce,
} from '../../lib/location';
import { apiConfigured, sendEvent, sendSos } from '../../lib/api';
import { registerForPush } from '../../lib/notifications';
import { MotionPressable, PulseRing, Reveal } from '../../components/Motion';
import { useFeedback } from '../../lib/feedback';

export default function ProtectionScreen() {
  const [name, setName] = useState('Family member');
  const [familyName, setFamilyName] = useState('Your family');
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [sosBusy, setSosBusy] = useState(false);
  const { success, alert } = useFeedback();

  useEffect(() => {
    getProfile().then((p) => {
      if (p?.displayName) setName(p.displayName);
      if (p?.familyName) setFamilyName(p.familyName);
    });
    if (Platform.OS !== 'web') isFamilyLocationSharingEnabled().then(setSharing);
  }, []);

  async function toggleSharing() {
    if (Platform.OS === 'web') {
      setMessage('Background location is available in the Android/iPhone build, not the web preview.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      if (sharing) {
        await disableFamilyLocationSharing();
        setSharing(false);
        await sendEvent('permission_changed', { location: 'sharing-stopped-by-user' }).catch(() => {});
        setMessage('Background location sharing stopped on this device.');
      } else {
        const result = await enableFamilyLocationSharing();
        if (result.ok) {
          setSharing(true);
          registerForPush().catch(() => {});
          await sendEvent('permission_changed', { location: 'background-enabled' }).catch(() => {});
          success();
          setMessage('Location sharing is active. Android keeps a visible notification and iPhone can show its location indicator.');
        } else {
          setMessage(result.reason === 'background_denied'
            ? 'Background location was not granted. You can enable “Always allow” in the phone settings.'
            : 'Location permission was not granted. AGAM will not share your location.');
        }
      }
    } catch {
      setMessage('Could not change location sharing. Check Location Services and permissions.');
    } finally {
      setBusy(false);
    }
  }

  async function checkIn() {
    setMessage('');
    if (Platform.OS === 'web') {
      setMessage('Preview check-in sent. The native app can include your current location.');
      return;
    }
    const result = await shareCurrentLocationOnce();
    if (result.ok) {
      await sendEvent('check_in', { label: 'I am safe' }).catch(() => {});
      success();
      setMessage('Check-in sent with your current location.');
    } else {
      setMessage('Location permission is needed to include your current location in check-in.');
    }
  }

  async function sos() {
    alert();
    setSosBusy(true);
    setMessage('');
    try {
      if (!apiConfigured()) {
        setMessage('Preview SOS activated. With the cloud connected, approved parents/guardians receive the alert and available live location.');
        return;
      }
      let latitude: number | undefined;
      let longitude: number | undefined;
      if (Platform.OS !== 'web') {
        const current = await shareCurrentLocationOnce();
        if (current.ok && current.location) {
          latitude = current.location.coords.latitude;
          longitude = current.location.coords.longitude;
        }
      }
      await sendSos({ latitude, longitude, note: 'Emergency SOS from AGAM Family' });
      setMessage('SOS sent to your approved family circle.');
    } catch {
      setMessage('SOS could not reach the cloud. If you are in immediate danger, use the phone emergency-call function.');
    } finally {
      setSosBusy(false);
    }
  }

  async function leaveDevice() {
    if (Platform.OS !== 'web') await disableFamilyLocationSharing().catch(() => {});
    await clearSession();
    router.replace('/');
  }

  return <Screen>
    <Logo />
    <Kicker>Protected family member</Kicker>
    <Title>{name}</Title>
    <Subtitle>Connected to {familyName}. Protection activity is never hidden on this device.</Subtitle>

    <Card style={sharing ? [styles.statusCard, { borderColor: 'rgba(45,227,154,.45)' }] : styles.statusCard}>
      <View style={[styles.statusIcon, { backgroundColor: sharing ? 'rgba(45,227,154,.13)' : 'rgba(145,166,190,.10)' }]}>
        <Ionicons name={sharing ? 'location' : 'location-outline'} size={26} color={sharing ? colors.green : colors.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statusTitle}>{sharing ? 'Location sharing active' : 'Location sharing is off'}</Text>
        <Text style={styles.statusText}>{sharing
          ? 'AGAM may update your location in the background. Android keeps an ongoing foreground-service notification while this is active.'
          : 'Your family will only see the last location you explicitly shared or checked in with.'}</Text>
      </View>
    </Card>

    <PrimaryButton
      label={busy ? 'Updating…' : sharing ? 'Stop location sharing' : 'Enable family location sharing'}
      icon={sharing ? 'stop-circle' : 'location'}
      onPress={toggleSharing}
      disabled={busy}
    />
    <SecondaryButton label="Send check-in now" icon="checkmark-circle" onPress={checkIn} />
    {Platform.OS !== 'web' ? <MotionPressable onPress={() => Linking.openSettings()} style={styles.settings}><Ionicons name="settings" size={15} color={colors.cyan}/><Text style={styles.settingsText}>Open device privacy settings</Text></MotionPressable> : null}

    <Reveal delay={120}><View style={styles.sosStage}>
      <PulseRing color="#FF445B" size={190} />
      <PulseRing color="#FF8998" size={225} />
      <MotionPressable onPress={sos} disabled={sosBusy} feedback={false} style={styles.sosOuter}>
        <LinearGradient colors={['#FF5266', '#D01834']} style={styles.sos}>
          <Ionicons name="alert" size={29} color="white" />
          <Text style={styles.sosTitle}>{sosBusy ? 'SENDING…' : 'SOS'}</Text>
          <Text style={styles.sosText}>Emergency alert</Text>
        </LinearGradient>
      </MotionPressable>
    </View></Reveal>

    {message ? <View style={styles.message}><Ionicons name="information-circle" size={18} color={colors.cyan} /><Text style={styles.messageText}>{message}</Text></View> : null}

    <Card>
      <FeatureRow icon="eye" title="Always visible" text="Location and Safety Audio status remain visible on this device." color={colors.cyan} />
      <FeatureRow icon="shield-checkmark" title="Approved family only" text="Only paired parents and guardians can access this private family circle." color={colors.green} />
      <FeatureRow icon="mic" title="Safety Audio is transparent" text="Microphone sessions are never designed to be hidden from the family-member device." color={colors.orange} />
      <FeatureRow icon="key" title="You stay in control" text="Permissions can always be changed in your phone settings." color={colors.purple} />
    </Card>

    <MotionPressable onPress={leaveDevice} style={styles.exit}><Text style={styles.exitText}>Leave this family on this device</Text></MotionPressable>
  </Screen>;
}

const styles = StyleSheet.create({
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  statusIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { color: colors.navy, fontSize: 15, fontWeight: '900' },
  statusText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  settings: { alignSelf: 'center', flexDirection: 'row', gap: 7, alignItems: 'center', padding: 8 },
  settingsText: { color: colors.cyan, fontSize: 10, fontWeight: '800' },
  sosStage: { alignSelf:'center', width:240, height:240, alignItems:'center', justifyContent:'center', marginVertical:6 },
  sosOuter: { alignSelf: 'center', padding: 10, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,68,91,.35)' },
  sos: { width: 160, height: 160, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 6, borderColor: 'rgba(255,255,255,.09)' },
  sosTitle: { color: 'white', fontSize: 34, fontWeight: '900' },
  sosText: { color: '#FFD4DA', fontSize: 10, fontWeight: '700' },
  message: { flexDirection: 'row', gap: 9, padding: 13, borderRadius: 15, backgroundColor: '#EDF7FF', borderWidth: 1, borderColor: '#CFE7F4' },
  messageText: { color: '#47657D', fontSize: 11, lineHeight: 16, flex: 1 },
  exit: { alignItems: 'center', padding: 10 },
  exitText: { color: '#D64C62', fontSize: 11, textDecorationLine: 'underline' },
});
