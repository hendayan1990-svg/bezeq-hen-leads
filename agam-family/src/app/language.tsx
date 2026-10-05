import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Card, Screen, Subtitle, Title } from '../components/BrandShell';
import { colors } from '../lib/theme';
import { localeOptions, useLocale, type LocaleCode } from '../lib/locale';

export default function LanguageScreen() {
  const { locale, setLocale, t, isRTL } = useLocale();
  const rtlText:any = isRTL ? { textAlign:'right', writingDirection:'rtl' } : undefined;
  async function choose(code:LocaleCode){ await setLocale(code); }
  return <Screen>
    <BackButton onPress={() => router.back()} />
    <Title>{t('selectLanguage')}</Title>
    <Subtitle>{t('languageSubtitle')}</Subtitle>
    {localeOptions.map(({name,flag,code}) => <Pressable key={code} onPress={() => choose(code)}>
      <Card style={[styles.row, locale === code ? styles.active : undefined, isRTL?styles.rtlRow:undefined].filter(Boolean) as any}>
        <Text style={styles.flag}>{flag}</Text>
        <Text style={[styles.name,rtlText]}>{name}</Text>
        {locale === code ? <Ionicons name="checkmark-circle" size={21} color={colors.cyan} /> : null}
      </Card>
    </Pressable>)}
  </Screen>;
}

const styles = StyleSheet.create({
  row: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, rtlRow:{flexDirection:'row-reverse'},
  active: { borderColor: 'rgba(54,197,255,.55)', backgroundColor: 'rgba(10,140,255,.10)' }, flag: { fontSize: 24 }, name: { color: 'white', fontSize: 13, fontWeight: '700', flex: 1 },
});
