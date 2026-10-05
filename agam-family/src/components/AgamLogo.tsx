import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors } from '../lib/theme';

export function AgamMark({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#DFFFF6" />
          <Stop offset="1" stopColor="#DDF5FF" />
        </LinearGradient>
        <LinearGradient id="blue" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#25C7FF" />
          <Stop offset="1" stopColor="#0876FF" />
        </LinearGradient>
        <LinearGradient id="mint" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#2BE0BC" />
          <Stop offset="1" stopColor="#04AFA2" />
        </LinearGradient>
        <LinearGradient id="heart" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFB66A" />
          <Stop offset="1" stopColor="#FF6D75" />
        </LinearGradient>
      </Defs>
      <Rect x="2" y="2" width="96" height="96" rx="28" fill="url(#bg)" />
      <Circle cx="34" cy="30" r="11" fill="url(#blue)" />
      <Circle cx="68" cy="30" r="11" fill="url(#mint)" />
      <Circle cx="51" cy="39" r="9" fill="#17BFCB" />
      <Path d="M13 70 C15 52 27 44 40 45 C44 47 47 51 50 55 C53 51 57 47 62 45 C77 45 88 55 88 72 C88 80 84 86 78 90 C72 82 65 76 57 72 C54 70 52 68 50 66 C48 68 46 70 43 72 C35 76 28 82 22 90 C16 86 13 80 13 70Z" fill="url(#mint)" opacity="0.96" />
      <Path d="M12 69 C13 53 24 45 38 45 C43 46 47 50 50 55 C46 61 42 66 35 70 C29 74 24 80 20 87 C15 83 12 77 12 69Z" fill="url(#blue)" />
      <Path d="M50 82 C44 76 32 69 32 59 C32 52 37 48 43 48 C47 48 50 51 52 54 C54 51 57 48 62 48 C68 48 73 53 73 59 C73 69 60 77 50 82Z" fill="white" />
      <Path d="M51 77 C47 73 39 67 39 60 C39 56 42 53 46 53 C49 53 51 55 52 58 C54 55 56 53 60 53 C64 53 67 56 67 60 C67 67 58 73 51 77Z" fill="url(#heart)" />
    </Svg>
  );
}

export function AgamLogo({ compact = false, rtl = false }: { compact?: boolean; rtl?: boolean }) {
  return (
    <View style={[styles.row, rtl && { flexDirection: 'row-reverse' }, compact && { marginBottom: 0 }]}> 
      <View style={styles.markShadow}><AgamMark size={compact ? 44 : 58} /></View>
      <View style={rtl ? { alignItems: 'flex-end' } : undefined}>
        <Text style={styles.wordmark}>AGAM <Text style={styles.family}>Family</Text></Text>
        {!compact ? <Text style={[styles.tagline, rtl && { textAlign: 'right' }]}>Family safety, beautifully connected.</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 8, flexShrink: 1 },
  markShadow: { borderRadius: 18, shadowColor: '#1DC8D0', shadowOpacity: .22, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  wordmark: { color: colors.navy, fontSize: 22, fontWeight: '900', letterSpacing: -.4 },
  family: { color: '#13B9B0' },
  tagline: { color: colors.muted, fontSize: 9, marginTop: 2, fontWeight: '600' },
});
