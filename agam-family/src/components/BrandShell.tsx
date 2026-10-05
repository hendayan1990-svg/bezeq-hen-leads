import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../lib/theme';
import { useLocale } from '../lib/locale';
import { MotionPressable } from './Motion';
import { AgamLogo } from './AgamLogo';

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const { isRTL } = useLocale();
  const dir:any = isRTL ? { direction:'rtl' } : { direction:'ltr' };
  const body = scroll
    ? <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.body,dir]}>{children}</ScrollView>
    : <View style={[styles.body,dir]}>{children}</View>;
  return <LinearGradient colors={['#FAFDFF','#F2FAFF','#F6FFFC']} style={styles.app}><SafeAreaView style={styles.safe}>{body}</SafeAreaView></LinearGradient>;
}

export function Logo({ compact = false }: { compact?: boolean }) {
  const { isRTL } = useLocale();
  return <AgamLogo compact={compact} rtl={isRTL}/>;
}

export function Kicker({ children }: { children: React.ReactNode }) { const {isRTL}=useLocale(); return <Text style={[styles.kicker,isRTL&&styles.rtlText]}>{children}</Text>; }
export function Title({ children }: { children: React.ReactNode }) { const {isRTL}=useLocale(); return <Text style={[styles.title,isRTL&&styles.rtlText]}>{children}</Text>; }
export function Subtitle({ children }: { children: React.ReactNode }) { const {isRTL}=useLocale(); return <Text style={[styles.subtitle,isRTL&&styles.rtlText]}>{children}</Text>; }

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({ label, onPress, icon, disabled }: { label: string; onPress: () => void; icon?: any; disabled?: boolean }) {
  const {isRTL}=useLocale();
  return <MotionPressable disabled={disabled} onPress={onPress}>
    <LinearGradient colors={['#16CDB8', '#0A8CFF']} start={{x:0,y:0}} end={{x:1,y:0}} style={[styles.primary,isRTL&&{flexDirection:'row-reverse'}]}>{icon ? <Ionicons name={icon} size={20} color="white" /> : null}<Text style={styles.primaryText}>{label}</Text></LinearGradient>
  </MotionPressable>;
}

export function SecondaryButton({ label, onPress, icon }: { label: string; onPress: () => void; icon?: any }) {
  const {isRTL}=useLocale();
  return <MotionPressable onPress={onPress} style={[styles.secondary,isRTL&&{flexDirection:'row-reverse'}]}>{icon ? <Ionicons name={icon} size={19} color={colors.blue} /> : null}<Text style={styles.secondaryText}>{label}</Text></MotionPressable>;
}

export function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType = 'default', autoCapitalize = 'none' }: any) {
  const {isRTL}=useLocale();
  return <View style={{ gap: 7 }}><Text style={[styles.fieldLabel,isRTL&&styles.rtlText]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9AB0C2" secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={[styles.input,isRTL&&{textAlign:'right',writingDirection:'rtl'}]} /></View>;
}

export function FeatureRow({ icon, title, text, color = colors.blue }: { icon: any; title: string; text: string; color?: string }) {
  const {isRTL}=useLocale();
  return <View style={[styles.feature,isRTL&&{flexDirection:'row-reverse'}]}><View style={[styles.featureIcon, { backgroundColor: `${color}16` }]}><Ionicons name={icon} size={21} color={color} /></View><View style={{ flex: 1 }}><Text style={[styles.featureTitle,isRTL&&styles.rtlText]}>{title}</Text><Text style={[styles.featureText,isRTL&&styles.rtlText]}>{text}</Text></View></View>;
}

export function BackButton({ onPress }: { onPress: () => void }) {
  const {isRTL}=useLocale();
  return <MotionPressable onPress={onPress} style={[styles.back,isRTL&&{alignSelf:'flex-end'}]}><Ionicons name={isRTL?'chevron-forward':'chevron-back'} size={22} color={colors.navy} /></MotionPressable>;
}

export function ErrorBox({ text }: { text?: string }) {
  const {isRTL}=useLocale();
  if (!text) return null;
  return <View style={[styles.error,isRTL&&{flexDirection:'row-reverse'}]}><Ionicons name="alert-circle" size={18} color={colors.red} /><Text style={[styles.errorText,isRTL&&styles.rtlText]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  app: { flex: 1 }, safe: { flex: 1 }, body: { flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 44, gap: 16, ...(Platform.OS === 'web' ? ({ boxSizing: 'border-box' } as any) : {}) },
  kicker: { color: colors.green, fontWeight: '900', fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 31, lineHeight: 38, fontWeight: '900', letterSpacing: -.7 }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 }, rtlText:{textAlign:'right',writingDirection:'rtl'},
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, borderRadius: 24, padding: 17, gap: 12, shadowColor: '#2C6C91', shadowOpacity: .08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  primary: { minHeight: 58, borderRadius: 20, paddingHorizontal: 18, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', shadowColor: colors.blue, shadowOpacity: .22, shadowRadius: 14, shadowOffset:{width:0,height:6} }, primaryText: { color: 'white', fontSize: 15, fontWeight: '900' },
  secondary: { minHeight: 56, borderRadius: 20, paddingHorizontal: 18, borderWidth: 1, borderColor: '#BFD9EB', backgroundColor: '#FFFFFF', flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: colors.navy, fontSize: 14, fontWeight: '800' },
  fieldLabel: { color: colors.navy, fontSize: 12, fontWeight: '800' }, input: { height: 56, paddingHorizontal: 15, borderRadius: 17, borderWidth: 1, borderColor: '#CFE0EC', backgroundColor: '#FFFFFF', color: colors.text, fontSize: 15 },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, featureIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, featureTitle: { color: colors.text, fontWeight: '900', fontSize: 13 }, featureText: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 3 },
  back: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', shadowColor:'#2A6388',shadowOpacity:.08,shadowRadius:10,elevation:1 },
  error: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#FFD0D6', backgroundColor: '#FFF2F4' }, errorText: { color: '#A83A4A', flex: 1, fontSize: 11, lineHeight: 16 },
});
