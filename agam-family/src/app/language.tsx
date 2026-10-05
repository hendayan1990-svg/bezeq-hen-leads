import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Card, Screen, Subtitle, Title } from '../components/BrandShell';
import { colors } from '../lib/theme';

const languages = [
  ['English', '🇬🇧', 'en'], ['עברית', '🇮🇱', 'he'], ['العربية', '🇦🇪', 'ar'],
  ['Español', '🇪🇸', 'es'], ['Français', '🇫🇷', 'fr'], ['Deutsch', '🇩🇪', 'de'],
  ['Italiano', '🇮🇹', 'it'], ['Português', '🇧🇷', 'pt'], ['Türkçe', '🇹🇷', 'tr'],
  ['हिन्दी', '🇮🇳', 'hi'], ['日本語', '🇯🇵', 'ja'], ['한국어', '🇰🇷', 'ko'],
];

export default function LanguageScreen() {
  const [selected, setSelected] = useState('en');
  return <Screen>
    <BackButton onPress={() => router.back()} />
    <Title>Select language</Title>
    <Subtitle>AGAM Family is structured for a global launch. English is the current product language; these locales are included in the localization roadmap, including RTL support for Hebrew and Arabic.</Subtitle>
    {languages.map(([name, flag, code]) => <Pressable key={code} onPress={() => setSelected(code)}>
      <Card style={[styles.row, selected === code ? styles.active : undefined].filter(Boolean) as any}>
        <Text style={styles.flag}>{flag}</Text>
        <Text style={styles.name}>{name}</Text>
        {selected === code ? <Ionicons name="checkmark-circle" size={21} color={colors.cyan} /> : null}
      </Card>
    </Pressable>)}
  </Screen>;
}

const styles = StyleSheet.create({
  row: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  active: { borderColor: 'rgba(54,197,255,.55)', backgroundColor: 'rgba(10,140,255,.10)' },
  flag: { fontSize: 24 },
  name: { color: 'white', fontSize: 13, fontWeight: '700', flex: 1 },
});
