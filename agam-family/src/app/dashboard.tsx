import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AgamLogo } from '../components/AgamLogo';
import NativeFamilyMap from '../components/NativeFamilyMap';
import { MotionPressable, PulseRing, Reveal } from '../components/Motion';
import { colors } from '../lib/theme';
import { useFamilyRealtime } from '../lib/realtime';
import { supabaseConfigured } from '../lib/supabase';
import { useLocale } from '../lib/locale';

const demoMembers=[
  {id:'1',display_name:'Noa',role:'child',latestLocation:{recorded_at:new Date().toISOString()}},
  {id:'2',display_name:'Dad',role:'parent',latestLocation:{recorded_at:new Date().toISOString()}},
  {id:'3',display_name:'Liam',role:'child',latestLocation:{recorded_at:new Date().toISOString()}},
];
const avatars=['#19C99A','#8A6CFF','#FFA544','#0A8CFF'];

function Quick({icon,label,color,bg,onPress}:any){return <MotionPressable onPress={onPress} style={styles.quick}><View style={[styles.quickIcon,{backgroundColor:bg}]}><Ionicons name={icon} size={21} color={color}/></View><Text style={styles.quickLabel}>{label}</Text></MotionPressable>}

function BottomNav(){
  return <View style={styles.nav}>
    <MotionPressable onPress={()=>{}} style={styles.navItem}><Ionicons name="map" size={23} color={colors.blue}/><Text style={[styles.navText,{color:colors.blue}]}>Map</Text></MotionPressable>
    <MotionPressable onPress={()=>router.push('/parent/pair')} style={styles.navItem}><Ionicons name="people" size={23} color="#8498AA"/><Text style={styles.navText}>Family</Text></MotionPressable>
    <MotionPressable onPress={()=>router.push('/sos')} style={styles.sosNav}><LinearGradient colors={['#FF6674','#F23F59']} style={styles.sosCircle}><Ionicons name="alert" size={25} color="white"/></LinearGradient><Text style={[styles.navText,{color:colors.red}]}>SOS</Text></MotionPressable>
    <MotionPressable onPress={()=>router.push('/plans')} style={styles.navItem}><Ionicons name="diamond" size={22} color="#8A6CFF"/><Text style={styles.navText}>Plus</Text></MotionPressable>
    <MotionPressable onPress={()=>router.push('/language')} style={styles.navItem}><Ionicons name="menu" size={23} color="#8498AA"/><Text style={styles.navText}>More</Text></MotionPressable>
  </View>
}

export default function DashboardScreen(){
  const {locale,isRTL}=useLocale();
  const live=useFamilyRealtime();
  const he=locale==='he';
  const members=supabaseConfigured&&live.members.length?live.members:demoMembers;
  const rtl:any=isRTL?{textAlign:'right',writingDirection:'rtl'}:undefined;
  const activeSos=supabaseConfigured?live.activeSos:[];

  return <LinearGradient colors={['#FBFEFF','#F3FAFF','#F7FFFC']} style={styles.app}>
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header,isRTL&&{flexDirection:'row-reverse'}]}>
        <AgamLogo compact rtl={isRTL}/>
        <View style={styles.livePill}>{supabaseConfigured&&live.connected?<PulseRing color={colors.green} size={25}/>:null}<View style={[styles.liveDot,{backgroundColor:supabaseConfigured&&live.connected?colors.green:'#F3B34C'}]}/><Text style={styles.liveText}>{supabaseConfigured?(live.connected?'LIVE':'SYNC'):'DEMO'}</Text></View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Reveal delay={20}><View style={[styles.heading,isRTL&&{flexDirection:'row-reverse'}]}><View style={{flex:1}}><Text style={[styles.safeKicker,rtl]}>{activeSos.length?(he?'נדרשת תשומת לב':'ATTENTION NEEDED'):(he?'כולם בטוחים':'EVERYONE IS SAFE')}</Text><Text style={[styles.title,rtl]}>{he?'המשפחה שלי':'My family'}</Text><Text style={[styles.sub,rtl]}>{he?'מיקום חי ועדכוני בטיחות במקום אחד':'Live location and safety at a glance'}</Text></View><MotionPressable onPress={()=>router.push('/parent/pair')} style={styles.add}><Ionicons name="person-add" size={20} color={colors.blue}/></MotionPressable></View></Reveal>

        {activeSos.length?<Reveal delay={70}><MotionPressable onPress={()=>router.push('/sos')}><View style={styles.alert}><View style={styles.alertIcon}><Ionicons name="alert" size={21} color="white"/></View><View style={{flex:1}}><Text style={styles.alertTitle}>Emergency SOS active</Text><Text style={styles.alertSub}>Tap to open emergency details</Text></View><Ionicons name="chevron-forward" size={19} color={colors.red}/></View></MotionPressable></Reveal>:null}

        <Reveal delay={90}><NativeFamilyMap members={members}/></Reveal>

        <Reveal delay={155}><View style={styles.quickRow}>
          <Quick icon="location" label={he?'אזורים':'Places'} color={colors.blue} bg={colors.softBlue} onPress={()=>router.push('/demo')}/>
          <Quick icon="time" label={he?'היסטוריה':'History'} color={colors.purple} bg="#F1EDFF" onPress={()=>router.push('/demo')}/>
          <Quick icon="mic" label={he?'שמע בטיחותי':'Safety Audio'} color="#07AFAE" bg="#E9FAF8" onPress={()=>router.push('/demo')}/>
          <Quick icon="checkmark-circle" label={he?'צ׳ק־אין':'Check-in'} color={colors.green} bg={colors.softMint} onPress={()=>{}}/>
        </View></Reveal>

        <Reveal delay={210}><View style={[styles.sectionHead,isRTL&&{flexDirection:'row-reverse'}]}><Text style={[styles.sectionTitle,rtl]}>{he?'בני המשפחה':'Family members'}</Text><MotionPressable onPress={()=>router.push('/parent/pair')}><Text style={styles.addText}>{he?'הוספה':'Add'}</Text></MotionPressable></View></Reveal>
        <View style={styles.members}>
          {members.slice(0,4).map((m:any,i:number)=><Reveal key={m.id||i} delay={240+i*45}><MotionPressable onPress={()=>router.push('/demo')} style={styles.memberCard}><View style={[styles.avatarRing,{borderColor:avatars[i%avatars.length]}]}><View style={[styles.avatar,{backgroundColor:avatars[i%avatars.length]}]}><Text style={styles.avatarText}>{(m.display_name||'?').slice(0,1).toUpperCase()}</Text></View><View style={styles.online}/></View><View style={{flex:1}}><Text style={[styles.memberName,rtl]}>{m.display_name}</Text><Text style={[styles.memberMeta,rtl]}>{i===0?(he?'בבית • עכשיו':'At home • now'):(he?`${i+1} דקות לפני`:`${i+1} min ago`)}</Text></View><View style={styles.battery}><Ionicons name="battery-half" size={18} color={colors.green}/><Text style={styles.batteryText}>{87-i*6}%</Text></View><Ionicons name={isRTL?'chevron-back':'chevron-forward'} size={18} color="#9AAEBD"/></MotionPressable></Reveal>)}
        </View>

        <Reveal delay={330}><MotionPressable onPress={()=>router.push('/plans')}><LinearGradient colors={['#F2ECFF','#E8F5FF']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.plusCard}><View style={styles.crown}><Ionicons name="diamond" size={20} color="#7658E8"/></View><View style={{flex:1}}><Text style={styles.plusTitle}>AGAM Family Plus</Text><Text style={styles.plusSub}>{he?'יותר היסטוריה, יותר אזורים, יותר שקט':'More history, more places, more peace of mind'}</Text></View><Ionicons name={isRTL?'chevron-back':'chevron-forward'} size={20} color="#7658E8"/></LinearGradient></MotionPressable></Reveal>

        {!supabaseConfigured?<Text style={styles.previewNote}>{he?'מוצגים נתוני דמו עד לחיבור הענן המאובטח.':'Preview data is shown until the secure cloud is connected.'}</Text>:live.loading?<ActivityIndicator color={colors.blue}/>:live.error?<Text style={styles.previewNote}>{live.error}</Text>:null}
      </ScrollView>
      <BottomNav/>
    </SafeAreaView>
  </LinearGradient>;
}

const styles=StyleSheet.create({
  app:{flex:1},safe:{flex:1},header:{height:68,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},livePill:{height:34,paddingHorizontal:11,borderRadius:999,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#DCEAF2',flexDirection:'row',gap:6,alignItems:'center',position:'relative'},liveDot:{width:7,height:7,borderRadius:99},liveText:{fontSize:8,fontWeight:'900',color:colors.navy,letterSpacing:.8},scroll:{paddingHorizontal:18,paddingBottom:112,gap:15},heading:{flexDirection:'row',alignItems:'center',gap:10},safeKicker:{color:colors.green,fontSize:10,fontWeight:'900',letterSpacing:1},title:{color:colors.navy,fontSize:29,fontWeight:'900',letterSpacing:-.7,marginTop:2},sub:{color:colors.muted,fontSize:10,marginTop:3},add:{width:45,height:45,borderRadius:16,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#D9E9F1',alignItems:'center',justifyContent:'center',shadowColor:'#25668C',shadowOpacity:.08,shadowRadius:10,elevation:1},alert:{minHeight:66,borderRadius:20,backgroundColor:'#FFF2F4',borderWidth:1,borderColor:'#FFD2D8',padding:11,flexDirection:'row',gap:10,alignItems:'center'},alertIcon:{width:42,height:42,borderRadius:14,backgroundColor:colors.red,alignItems:'center',justifyContent:'center'},alertTitle:{color:'#A43042',fontWeight:'900',fontSize:12},alertSub:{color:'#B56D78',fontSize:9,marginTop:2},quickRow:{flexDirection:'row',gap:7},quick:{flex:1,alignItems:'center',gap:6},quickIcon:{width:48,height:48,borderRadius:16,alignItems:'center',justifyContent:'center'},quickLabel:{color:'#536C82',fontSize:8,fontWeight:'800',textAlign:'center'},sectionHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},sectionTitle:{color:colors.navy,fontSize:16,fontWeight:'900'},addText:{color:colors.blue,fontSize:10,fontWeight:'900'},members:{gap:9},memberCard:{minHeight:72,borderRadius:21,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#DFEAF0',padding:11,flexDirection:'row',gap:10,alignItems:'center',shadowColor:'#2D6D91',shadowOpacity:.05,shadowRadius:12,elevation:1},avatarRing:{width:48,height:48,borderRadius:99,borderWidth:2,alignItems:'center',justifyContent:'center',position:'relative'},avatar:{width:40,height:40,borderRadius:99,alignItems:'center',justifyContent:'center'},avatarText:{color:'white',fontWeight:'900',fontSize:15},online:{position:'absolute',right:-1,bottom:-1,width:12,height:12,borderRadius:99,backgroundColor:colors.green,borderWidth:2,borderColor:'white'},memberName:{color:colors.navy,fontWeight:'900',fontSize:12},memberMeta:{color:colors.muted,fontSize:9,marginTop:3},battery:{flexDirection:'row',gap:3,alignItems:'center'},batteryText:{color:'#4F7D69',fontSize:8,fontWeight:'800'},plusCard:{minHeight:76,borderRadius:22,padding:13,flexDirection:'row',gap:10,alignItems:'center',borderWidth:1,borderColor:'#DDD7FA'},crown:{width:44,height:44,borderRadius:15,backgroundColor:'rgba(138,108,255,.12)',alignItems:'center',justifyContent:'center'},plusTitle:{color:'#4B369A',fontSize:13,fontWeight:'900'},plusSub:{color:'#786E9A',fontSize:9,marginTop:3},previewNote:{color:'#8AA0B2',fontSize:8,textAlign:'center',lineHeight:13,paddingHorizontal:20},nav:{height:76,borderTopWidth:1,borderColor:'#E2ECF2',backgroundColor:'rgba(255,255,255,.98)',flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingBottom:5},navItem:{flex:1,alignItems:'center',justifyContent:'center',gap:3},navText:{fontSize:8,color:'#879BAC',fontWeight:'700'},sosNav:{flex:1,alignItems:'center',justifyContent:'center',gap:1},sosCircle:{width:54,height:54,borderRadius:99,alignItems:'center',justifyContent:'center',marginTop:-24,borderWidth:4,borderColor:'#FFFFFF',shadowColor:colors.red,shadowOpacity:.22,shadowRadius:12,elevation:3}
});
