import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Logo, Kicker, Title, Subtitle, Card, PrimaryButton, SecondaryButton, FeatureRow } from '../components/BrandShell';
import { colors } from '../lib/theme';
import { localeOptions, useLocale } from '../lib/locale';

export default function WelcomeScreen() {
  const { t, locale, isRTL } = useLocale();
  const current = localeOptions.find(x=>x.code===locale) || localeOptions[0];
  const rtlText:any = isRTL ? { textAlign:'right', writingDirection:'rtl' } : undefined;
  return (
    <Screen>
      <View style={[styles.top,isRTL&&{flexDirection:'row-reverse'}]}>
        <Logo />
        <Pressable onPress={()=>router.push('/language')} style={styles.langPill}><Text style={styles.flag}>{current.flag}</Text><Text style={styles.langCode}>{current.code.toUpperCase()}</Text><Ionicons name="chevron-down" size={13} color={colors.cyan}/></Pressable>
      </View>
      <View style={styles.hero}>
        <Image source={require('../../assets/icon.png')} style={styles.heroIcon} />
        <Kicker>{t('welcomeKicker')}</Kicker>
        <Title>{t('welcomeTitle')}</Title>
        <Subtitle>{t('welcomeSubtitle')}</Subtitle>
      </View>

      <Card>
        <Pressable onPress={() => router.push('/parent/register')} style={[styles.roleRow,isRTL&&{flexDirection:'row-reverse'}]}>
          <View style={[styles.roleIcon, { backgroundColor: 'rgba(10,140,255,.15)' }]}><Ionicons name="shield-checkmark" size={25} color={colors.cyan} /></View>
          <View style={{ flex: 1 }}><Text style={[styles.roleTitle,rtlText]}>{t('parentRole')}</Text><Text style={[styles.roleText,rtlText]}>{t('parentRoleSub')}</Text></View>
          <Ionicons name={isRTL?'chevron-back':'chevron-forward'} size={20} color={colors.muted} />
        </Pressable>
        <View style={styles.line} />
        <Pressable onPress={() => router.push('/family/join')} style={[styles.roleRow,isRTL&&{flexDirection:'row-reverse'}]}>
          <View style={[styles.roleIcon, { backgroundColor: 'rgba(45,227,154,.13)' }]}><Ionicons name="people" size={25} color={colors.green} /></View>
          <View style={{ flex: 1 }}><Text style={[styles.roleTitle,rtlText]}>{t('joinRole')}</Text><Text style={[styles.roleText,rtlText]}>{t('joinRoleSub')}</Text></View>
          <Ionicons name={isRTL?'chevron-back':'chevron-forward'} size={20} color={colors.muted} />
        </Pressable>
      </Card>

      <View style={{ gap: 10 }}>
        <PrimaryButton label={t('createFamily')} icon="arrow-forward" onPress={() => router.push('/parent/register')} />
        <SecondaryButton label={t('signIn')} icon="log-in" onPress={() => router.push('/parent/login')} />
        <Pressable onPress={() => router.push('/demo')} style={styles.demo}><Text style={styles.demoText}>{t('exploreDemo')}</Text><Ionicons name="sparkles" size={15} color={colors.cyan} /></Pressable>
      </View>

      <Card>
        <FeatureRow icon="lock-closed" title={t('privacyFirst')} text={t('privacyFirstSub')} color={colors.green} />
        <FeatureRow icon="eye" title={t('transparent')} text={t('transparentSub')} />
        <FeatureRow icon="globe" title={t('global')} text={t('globalSub')} color={colors.purple} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'},langPill:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:10,paddingVertical:7,borderRadius:999,borderWidth:1,borderColor:'#245477',backgroundColor:'#081B2E'},flag:{fontSize:15},langCode:{color:'#D9EDFA',fontSize:10,fontWeight:'900'},
  hero: { alignItems: 'center', gap: 10, marginVertical: 6 }, heroIcon: { width: 94, height: 94, borderRadius: 25, marginBottom: 4 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 3 }, roleIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  roleTitle: { color: 'white', fontSize: 15, fontWeight: '900' }, roleText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, line: { height: 1, backgroundColor: 'rgba(90,140,180,.15)' },
  demo: { height: 42, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' }, demoText: { color: '#BFEAFF', fontSize: 12, fontWeight: '800' },
});
