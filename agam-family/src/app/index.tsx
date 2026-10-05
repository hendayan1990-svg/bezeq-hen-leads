import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AgamLogo } from '../components/AgamLogo';
import FamilyHeroScene from '../components/FamilyHeroScene';
import { MotionPressable, Reveal } from '../components/Motion';
import { colors } from '../lib/theme';
import { localeOptions, useLocale } from '../lib/locale';

function FeatureChip({ icon, label, color, bg }: any) {
  return <View style={[styles.chip,{backgroundColor:bg}]}><View style={[styles.chipIcon,{backgroundColor:`${color}18`}]}><Ionicons name={icon} size={18} color={color}/></View><Text style={styles.chipText}>{label}</Text></View>;
}

export default function WelcomeScreen() {
  const { locale, isRTL } = useLocale();
  const current = localeOptions.find(x=>x.code===locale) || localeOptions[0];
  const rtl:any=isRTL?{textAlign:'right',writingDirection:'rtl'}:undefined;
  const he=locale==='he';

  return <LinearGradient colors={['#FBFEFF','#F3FBFF','#F6FFFC']} style={styles.app}>
    <SafeAreaView style={styles.safe}>
      <View style={[styles.top,isRTL&&{flexDirection:'row-reverse'}]}>
        <AgamLogo compact rtl={isRTL}/>
        <MotionPressable onPress={()=>router.push('/language')} style={styles.langPill}>
          <Text style={styles.flag}>{current.flag}</Text><Text style={styles.langCode}>{current.code.toUpperCase()}</Text><Ionicons name="chevron-down" size={13} color={colors.navy}/>
        </MotionPressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} bounces={false}>
        <Reveal delay={30}><FamilyHeroScene/></Reveal>

        <Reveal delay={100}><View style={styles.copy}>
          <Text style={[styles.eyebrow,rtl]}>{he?'בטיחות משפחתית, פשוטה ויפה':'FAMILY SAFETY, BEAUTIFULLY CONNECTED'}</Text>
          <Text style={[styles.title,rtl]}>{he?'לדעת שהם בטוחים.\nלהרגיש שהם קרובים.':"Know they're safe.\nFeel they're close."}</Text>
          <Text style={[styles.subtitle,rtl]}>{he?'מיקום חי, אזורים בטוחים, SOS וצ׳ק־אין — במעגל משפחתי פרטי ושקוף.':'Live location, Safe Places, SOS and check-ins in one private family circle.'}</Text>
        </View></Reveal>

        <Reveal delay={170}><View style={styles.chips}>
          <FeatureChip icon="location" label={he?'מיקום חי':'Live location'} color={colors.blue} bg={colors.softBlue}/>
          <FeatureChip icon="shield-checkmark" label={he?'אזורים בטוחים':'Safe Places'} color={colors.green} bg={colors.softMint}/>
          <FeatureChip icon="alert-circle" label="SOS" color={colors.red} bg={colors.softPink}/>
        </View></Reveal>

        <Reveal delay={230}><MotionPressable onPress={()=>router.push('/tour')} style={[styles.tour,isRTL&&{flexDirection:'row-reverse'}]}>
          <View style={styles.play}><Ionicons name="play" size={17} color="white"/></View>
          <View style={{flex:1}}><Text style={[styles.tourTitle,rtl]}>{he?'ראו איך AGAM עובדת':'See AGAM in action'}</Text><Text style={[styles.tourSub,rtl]}>{he?'הדרכה מונפשת קצרה של פחות מדקה':'A quick animated walkthrough'}</Text></View>
          <Ionicons name={isRTL?'chevron-back':'chevron-forward'} size={20} color={colors.blue}/>
        </MotionPressable></Reveal>
      </ScrollView>

      <View style={styles.bottom}>
        <MotionPressable onPress={()=>router.push('/parent/register')}>
          <LinearGradient colors={['#16CDB8','#0A8CFF']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.primary}>
            <Ionicons name="people" size={20} color="white"/><Text style={styles.primaryText}>{he?'יצירת משפחה':'Create family'}</Text>
          </LinearGradient>
        </MotionPressable>
        <View style={styles.secondaryRow}>
          <MotionPressable onPress={()=>router.push('/family/join')} style={styles.secondary}><Ionicons name="key" size={18} color={colors.blue}/><Text style={styles.secondaryText}>{he?'יש לי קוד':'Join with code'}</Text></MotionPressable>
          <MotionPressable onPress={()=>router.push('/parent/login')} style={styles.secondary}><Ionicons name="log-in" size={18} color={colors.navy}/><Text style={styles.secondaryText}>{he?'כניסה':'Sign in'}</Text></MotionPressable>
        </View>
        <MotionPressable onPress={()=>router.push('/demo')} style={styles.demo}><Ionicons name="sparkles" size={15} color={colors.purple}/><Text style={styles.demoText}>{he?'צפייה בדמו האינטראקטיבי':'Explore interactive demo'}</Text></MotionPressable>
      </View>
    </SafeAreaView>
  </LinearGradient>;
}

const styles=StyleSheet.create({
  app:{flex:1,width:'100%',maxWidth:'100%'},safe:{flex:1,width:'100%',maxWidth:'100%',overflow:'hidden'},top:{height:66,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},scroll:{paddingHorizontal:18,paddingBottom:18,gap:16,...(Platform.OS==='web'?({boxSizing:'border-box'} as any):{})},langPill:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:11,paddingVertical:8,borderRadius:999,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#DCEAF3',shadowColor:'#2A6388',shadowOpacity:.07,shadowRadius:10,elevation:1},flag:{fontSize:16},langCode:{color:colors.navy,fontSize:10,fontWeight:'900'},copy:{gap:8,paddingHorizontal:3},eyebrow:{color:colors.green,fontSize:10,fontWeight:'900',letterSpacing:1.05},title:{color:colors.navy,fontSize:34,lineHeight:39,fontWeight:'900',letterSpacing:-1},subtitle:{color:colors.muted,fontSize:13,lineHeight:19,maxWidth:420},chips:{flexDirection:'row',gap:8},chip:{flex:1,minHeight:70,borderRadius:19,padding:9,alignItems:'center',justifyContent:'center',gap:6,borderWidth:1,borderColor:'rgba(30,120,170,.06)'},chipIcon:{width:32,height:32,borderRadius:11,alignItems:'center',justifyContent:'center'},chipText:{color:colors.navy,fontSize:9,fontWeight:'800',textAlign:'center'},tour:{minHeight:66,borderRadius:20,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#DCEAF3',padding:11,flexDirection:'row',alignItems:'center',gap:11,shadowColor:'#2A6388',shadowOpacity:.07,shadowRadius:13,shadowOffset:{width:0,height:6},elevation:1},play:{width:42,height:42,borderRadius:14,backgroundColor:colors.blue,alignItems:'center',justifyContent:'center'},tourTitle:{color:colors.navy,fontSize:12,fontWeight:'900'},tourSub:{color:colors.muted,fontSize:9,marginTop:3},bottom:{paddingHorizontal:18,paddingTop:10,paddingBottom:8,gap:9,backgroundColor:'rgba(250,253,255,.96)',borderTopWidth:1,borderTopColor:'#E5EFF5'},primary:{height:56,borderRadius:19,flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center',shadowColor:colors.blue,shadowOpacity:.2,shadowRadius:14,elevation:3},primaryText:{color:'white',fontSize:15,fontWeight:'900'},secondaryRow:{flexDirection:'row',gap:9},secondary:{flex:1,height:48,borderRadius:17,borderWidth:1,borderColor:'#D2E3EE',backgroundColor:'#FFFFFF',flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center'},secondaryText:{color:colors.navy,fontSize:11,fontWeight:'800'},demo:{height:31,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6},demoText:{color:'#617B92',fontSize:10,fontWeight:'800'}
});
