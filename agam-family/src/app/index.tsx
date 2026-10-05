import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Logo, Kicker, Title, Subtitle, Card, PrimaryButton, SecondaryButton, FeatureRow } from '../components/BrandShell';
import { AnimatedBrandMark, MotionPressable, Reveal } from '../components/Motion';
import { colors } from '../lib/theme';
import { localeOptions, useLocale } from '../lib/locale';

export default function WelcomeScreen() {
  const { t, locale, isRTL } = useLocale();
  const current = localeOptions.find(x=>x.code===locale) || localeOptions[0];
  const rtlText:any = isRTL ? { textAlign:'right', writingDirection:'rtl' } : undefined;
  return <Screen>
    <Reveal delay={20}><View style={[styles.top,isRTL&&{flexDirection:'row-reverse'}]}>
      <Logo />
      <MotionPressable onPress={()=>router.push('/language')} style={styles.langPill}><Text style={styles.flag}>{current.flag}</Text><Text style={styles.langCode}>{current.code.toUpperCase()}</Text><Ionicons name="chevron-down" size={13} color={colors.cyan}/></MotionPressable>
    </View></Reveal>

    <Reveal delay={80}><View style={styles.hero}>
      <AnimatedBrandMark size={118}/>
      <Kicker>{t('welcomeKicker')}</Kicker>
      <Title>{t('welcomeTitle')}</Title>
      <Subtitle>{t('welcomeSubtitle')}</Subtitle>
    </View></Reveal>

    <Reveal delay={160}><MotionPressable onPress={()=>router.push('/tour')} style={styles.tourCard}>
      <View style={styles.tourIcon}><Ionicons name="play" size={20} color="white"/></View>
      <View style={{flex:1}}><Text style={[styles.tourTitle,rtlText]}>{locale==='he'?'ראו איך AGAM עובדת':'See how AGAM works'}</Text><Text style={[styles.tourSub,rtlText]}>{locale==='he'?'הדרכה מונפשת קצרה: משפחה, מפה ו-SOS':'A short animated tour: family, live map and SOS'}</Text></View>
      <Ionicons name={isRTL?'chevron-back':'chevron-forward'} size={20} color={colors.cyan}/>
    </MotionPressable></Reveal>

    <Reveal delay={235}><Card>
      <MotionPressable onPress={() => router.push('/parent/register')} style={[styles.roleRow,isRTL&&{flexDirection:'row-reverse'}]}>
        <View style={[styles.roleIcon, { backgroundColor: 'rgba(10,140,255,.15)' }]}><Ionicons name="shield-checkmark" size={25} color={colors.cyan} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.roleTitle,rtlText]}>{t('parentRole')}</Text><Text style={[styles.roleText,rtlText]}>{t('parentRoleSub')}</Text></View>
        <Ionicons name={isRTL?'chevron-back':'chevron-forward'} size={20} color={colors.muted} />
      </MotionPressable>
      <View style={styles.line} />
      <MotionPressable onPress={() => router.push('/family/join')} style={[styles.roleRow,isRTL&&{flexDirection:'row-reverse'}]}>
        <View style={[styles.roleIcon, { backgroundColor: 'rgba(45,227,154,.13)' }]}><Ionicons name="people" size={25} color={colors.green} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.roleTitle,rtlText]}>{t('joinRole')}</Text><Text style={[styles.roleText,rtlText]}>{t('joinRoleSub')}</Text></View>
        <Ionicons name={isRTL?'chevron-back':'chevron-forward'} size={20} color={colors.muted} />
      </MotionPressable>
    </Card></Reveal>

    <Reveal delay={310}><View style={{ gap: 10 }}>
      <PrimaryButton label={t('createFamily')} icon="arrow-forward" onPress={() => router.push('/parent/register')} />
      <SecondaryButton label={t('signIn')} icon="log-in" onPress={() => router.push('/parent/login')} />
      <MotionPressable onPress={() => router.push('/demo')} style={styles.demo}><Text style={styles.demoText}>{t('exploreDemo')}</Text><Ionicons name="sparkles" size={15} color={colors.cyan} /></MotionPressable>
    </View></Reveal>

    <Reveal delay={385}><Card>
      <FeatureRow icon="lock-closed" title={t('privacyFirst')} text={t('privacyFirstSub')} color={colors.green} />
      <FeatureRow icon="eye" title={t('transparent')} text={t('transparentSub')} />
      <FeatureRow icon="globe" title={t('global')} text={t('globalSub')} color={colors.purple} />
    </Card></Reveal>
  </Screen>;
}

const styles = StyleSheet.create({
  top:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'},langPill:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:10,paddingVertical:7,borderRadius:999,borderWidth:1,borderColor:'#245477',backgroundColor:'#081B2E'},flag:{fontSize:15},langCode:{color:'#D9EDFA',fontSize:10,fontWeight:'900'},
  hero:{alignItems:'center',gap:10,marginVertical:3},tourCard:{minHeight:74,borderRadius:22,padding:13,flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'rgba(10,140,255,.10)',borderWidth:1,borderColor:'rgba(54,197,255,.30)'},tourIcon:{width:45,height:45,borderRadius:15,backgroundColor:'#0874FF',alignItems:'center',justifyContent:'center',shadowColor:'#16B6FF',shadowOpacity:.45,shadowRadius:14},tourTitle:{color:'white',fontSize:13,fontWeight:'900'},tourSub:{color:colors.muted,fontSize:9,lineHeight:14,marginTop:3},
  roleRow:{flexDirection:'row',alignItems:'center',gap:13,paddingVertical:3},roleIcon:{width:48,height:48,borderRadius:15,alignItems:'center',justifyContent:'center'},roleTitle:{color:'white',fontSize:15,fontWeight:'900'},roleText:{color:colors.muted,fontSize:11,lineHeight:16,marginTop:3},line:{height:1,backgroundColor:'rgba(90,140,180,.15)'},demo:{height:42,flexDirection:'row',gap:6,alignItems:'center',justifyContent:'center'},demoText:{color:'#BFEAFF',fontSize:12,fontWeight:'800'},
});
