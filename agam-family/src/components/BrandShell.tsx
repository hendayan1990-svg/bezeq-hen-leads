import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../lib/theme';
import { useLocale } from '../lib/locale';

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const { isRTL } = useLocale();
  const dir:any = isRTL ? { direction:'rtl' } : { direction:'ltr' };
  const body = scroll
    ? <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.body,dir]}>{children}</ScrollView>
    : <View style={[styles.body,dir]}>{children}</View>;
  return <LinearGradient colors={[colors.bg, colors.bg2, colors.bg]} style={styles.app}><SafeAreaView style={styles.safe}>{body}</SafeAreaView></LinearGradient>;
}

export function Logo({ compact = false }: { compact?: boolean }) {
  const { t, isRTL } = useLocale();
  return <View style={[styles.logoRow, compact && { marginBottom: 0 }, isRTL && { flexDirection:'row-reverse' }]}>
    <LinearGradient colors={['#20C4FF', '#0872FF']} style={styles.logoIcon}><Ionicons name="people" size={27} color="white" /></LinearGradient>
    <View><Text style={[styles.logoText,isRTL&&styles.rtlText]}>AGAM <Text style={{ color: colors.cyan }}>Family</Text></Text><Text style={[styles.logoSub,isRTL&&styles.rtlText]}>{t('tagline')}</Text></View>
  </View>;
}

export function Kicker({ children }: { children: React.ReactNode }) { const {isRTL}=useLocale(); return <Text style={[styles.kicker,isRTL&&styles.rtlText]}>{children}</Text>; }
export function Title({ children }: { children: React.ReactNode }) { const {isRTL}=useLocale(); return <Text style={[styles.title,isRTL&&styles.rtlText]}>{children}</Text>; }
export function Subtitle({ children }: { children: React.ReactNode }) { const {isRTL}=useLocale(); return <Text style={[styles.subtitle,isRTL&&styles.rtlText]}>{children}</Text>; }

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({ label, onPress, icon, disabled }: { label: string; onPress: () => void; icon?: any; disabled?: boolean }) {
  const {isRTL}=useLocale();
  return <Pressable disabled={disabled} onPress={onPress} style={{ opacity: disabled ? .45 : 1 }}>
    <LinearGradient colors={['#16B6FF', '#0874FF']} style={[styles.primary,isRTL&&{flexDirection:'row-reverse'}]}>{icon ? <Ionicons name={icon} size={20} color="white" /> : null}<Text style={styles.primaryText}>{label}</Text></LinearGradient>
  </Pressable>;
}

export function SecondaryButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: any }) {
  const {isRTL}=useLocale();
  return <Pressable onPress={onPress} style={[styles.secondary,isRTL&&{flexDirection:'row-reverse'}]}>{icon ? <Ionicons name={icon} size={19} color={colors.cyan} /> : null}<Text style={styles.secondaryText}>{label}</Text></Pressable>;
}

export function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType = 'default', autoCapitalize = 'none' }: any) {
  const {isRTL}=useLocale();
  return <View style={{ gap: 7 }}><Text style={[styles.fieldLabel,isRTL&&styles.rtlText]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#5F748B" secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={[styles.input,isRTL&&{textAlign:'right',writingDirection:'rtl'}]} /></View>;
}

export function FeatureRow({ icon, title, text, color = colors.cyan }: { icon: any; title: string; text: string; color?: string }) {
  const {isRTL}=useLocale();
  return <View style={[styles.feature,isRTL&&{flexDirection:'row-reverse'}]}><View style={[styles.featureIcon, { backgroundColor: `${color}16` }]}><Ionicons name={icon} size={21} color={color} /></View><View style={{ flex: 1 }}><Text style={[styles.featureTitle,isRTL&&styles.rtlText]}>{title}</Text><Text style={[styles.featureText,isRTL&&styles.rtlText]}>{text}</Text></View></View>;
}

export function BackButton({ onPress }: { onPress: () => void }) {
  const {isRTL}=useLocale();
  return <Pressable onPress={onPress} style={[styles.back,isRTL&&{alignSelf:'flex-end'}]}><Ionicons name={isRTL?'chevron-forward':'chevron-back'} size={22} color="white" /></Pressable>;
}

export function ErrorBox({ text }: { text?: string }) {
  const {isRTL}=useLocale();
  if (!text) return null;
  return <View style={[styles.error,isRTL&&{flexDirection:'row-reverse'}]}><Ionicons name="alert-circle" size={18} color="#FF90A0" /><Text style={[styles.errorText,isRTL&&styles.rtlText]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  app: { flex: 1 }, safe: { flex: 1 }, body: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 18, paddingBottom: 44, gap: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }, logoIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: colors.blue, shadowOpacity: .45, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
  logoText: { color: 'white', fontSize: 22, fontWeight: '900' }, logoSub: { color: colors.muted, fontSize: 10, marginTop: 2 }, kicker: { color: colors.green, fontWeight: '900', fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 31, lineHeight: 37, fontWeight: '900', letterSpacing: -.5 }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 }, rtlText:{textAlign:'right',writingDirection:'rtl'},
  card: { backgroundColor: 'rgba(12,27,46,.88)', borderWidth: 1, borderColor: 'rgba(76,142,190,.22)', borderRadius: 22, padding: 17, gap: 12 },
  primary: { minHeight: 56, borderRadius: 17, paddingHorizontal: 18, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: 'white', fontSize: 15, fontWeight: '900' },
  secondary: { minHeight: 54, borderRadius: 17, paddingHorizontal: 18, borderWidth: 1, borderColor: '#25577B', backgroundColor: '#0A1A2C', flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: '#DFF2FF', fontSize: 14, fontWeight: '800' },
  fieldLabel: { color: '#DCE8F3', fontSize: 12, fontWeight: '700' }, input: { height: 54, paddingHorizontal: 15, borderRadius: 16, borderWidth: 1, borderColor: '#234764', backgroundColor: '#081827', color: 'white', fontSize: 15 },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, featureIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, featureTitle: { color: 'white', fontWeight: '800', fontSize: 13 }, featureText: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 3 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#0D2136', borderWidth: 1, borderColor: '#1E425F', alignItems: 'center', justifyContent: 'center' },
  error: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#6B2C39', backgroundColor: '#391C24' }, errorText: { color: '#FFBEC8', flex: 1, fontSize: 11, lineHeight: 16 },
});
