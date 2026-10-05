import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Logo, Kicker, Title, Subtitle, Card, PrimaryButton, SecondaryButton, FeatureRow } from '../components/BrandShell';
import { colors } from '../lib/theme';

export default function WelcomeScreen() {
  return (
    <Screen>
      <Logo />
      <View style={styles.hero}>
        <Image source={require('../../assets/icon.png')} style={styles.heroIcon} />
        <Kicker>Family safety, reimagined</Kicker>
        <Title>Stay close without feeling intrusive.</Title>
        <Subtitle>Private family location, SOS, Safe Places and transparent Safety Audio — built around consent and clear controls.</Subtitle>
      </View>

      <Card>
        <Pressable onPress={() => router.push('/parent/register')} style={styles.roleRow}>
          <View style={[styles.roleIcon, { backgroundColor: 'rgba(10,140,255,.15)' }]}><Ionicons name="shield-checkmark" size={25} color={colors.cyan} /></View>
          <View style={{ flex: 1 }}><Text style={styles.roleTitle}>I’m a parent</Text><Text style={styles.roleText}>Create and manage your private family circle.</Text></View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>
        <View style={styles.line} />
        <Pressable onPress={() => router.push('/family/join')} style={styles.roleRow}>
          <View style={[styles.roleIcon, { backgroundColor: 'rgba(45,227,154,.13)' }]}><Ionicons name="people" size={25} color={colors.green} /></View>
          <View style={{ flex: 1 }}><Text style={styles.roleTitle}>I’m joining my family</Text><Text style={styles.roleText}>Enter the 6-digit code from your parent or guardian.</Text></View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>
      </Card>

      <View style={{ gap: 10 }}>
        <PrimaryButton label="Create family" icon="arrow-forward" onPress={() => router.push('/parent/register')} />
        <SecondaryButton label="Sign in" icon="log-in" onPress={() => router.push('/parent/login')} />
        <Pressable onPress={() => router.push('/demo')} style={styles.demo}><Text style={styles.demoText}>Explore interactive demo</Text><Ionicons name="sparkles" size={15} color={colors.cyan} /></Pressable>
      </View>

      <Card>
        <FeatureRow icon="lock-closed" title="Privacy-first" text="Only approved family members can access your circle." color={colors.green} />
        <FeatureRow icon="eye" title="Transparent monitoring" text="Location and microphone activity are never hidden from the family member device." />
        <FeatureRow icon="globe" title="Built for the world" text="Multi-language foundation with RTL support for Hebrew and Arabic." color={colors.purple} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 10, marginVertical: 6 },
  heroIcon: { width: 94, height: 94, borderRadius: 25, marginBottom: 4 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 3 },
  roleIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  roleTitle: { color: 'white', fontSize: 15, fontWeight: '900' },
  roleText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  line: { height: 1, backgroundColor: 'rgba(90,140,180,.15)' },
  demo: { height: 42, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  demoText: { color: '#BFEAFF', fontSize: 12, fontWeight: '800' },
});
