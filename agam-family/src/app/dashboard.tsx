import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Logo, Screen } from '../components/BrandShell';
import { AnimatedRoute, Floating, MotionPressable, PulseRing, Reveal } from '../components/Motion';
import { colors } from '../lib/theme';
import { useFamilyRealtime } from '../lib/realtime';
import { supabaseConfigured } from '../lib/supabase';
import { useLocale } from '../lib/locale';

function ago(iso?:string){
  if(!iso)return 'No location yet';
  const sec=Math.max(0,Math.floor((Date.now()-new Date(iso).getTime())/1000));
  if(sec<60)return `${sec}s ago`;
  const min=Math.floor(sec/60); if(min<60)return `${min}m ago`;
  return `${Math.floor(min/60)}h ago`;
}

const avatarColors=['#25D49A','#7768FF','#FF9D42','#18B8E8','#ED62AC','#65B2FF'];

function MapMarker({ member, index }: any){
  const c=avatarColors[index%avatarColors.length];
  return <Floating distance={5+(index%2)*2} duration={1350+index*130} style={[styles.mapMember,{left:`${12+(index%2)*49}%`,top:`${35+Math.floor(index/2)*31}%`}]}> 
    <View style={styles.markerPulse}><PulseRing color={c} size={58}/><LinearGradient colors={[c,colors.blue]} style={styles.marker}><Text style={styles.markerText}>{member.display_name?.slice(0,1).toUpperCase()||'?'}</Text></LinearGradient></View>
    <View style={styles.markerLabel}><Text style={styles.markerName}>{member.display_name}</Text><Text style={styles.markerTime}>{ago(member.latestLocation?.recorded_at)}</Text></View>
  </Floating>;
}

function Action({ icon, label, color, bg, onPress }: any){
  return <MotionPressable onPress={onPress} style={styles.action}><View style={[styles.actionIcon,{backgroundColor:bg}]}><Ionicons name={icon} size={22} color={color}/></View><Text style={styles.actionText}>{label}</Text></MotionPressable>;
}

export default function DashboardScreen(){
  const {locale,isRTL}=useLocale();
  const live=useFamilyRealtime();
  const rtl:any=isRTL?{textAlign:'right',writingDirection:'rtl'}:undefined;

  if(!supabaseConfigured){
    return <Screen><Reveal><Logo/></Reveal><Reveal delay={90}><Card style={styles.center}><Ionicons name="cloud-offline" size={34} color={colors.cyan}/><Text style={[styles.title,rtl]}>{locale==='he'?'מצב Preview':'Preview mode'}</Text><Text style={[styles.sub,rtl]}>{locale==='he'?'הדשבורד החי יופעל אוטומטית כשהענן מחובר. כרגע אפשר להמשיך לדמו האינטראקטיבי.':'The live dashboard activates automatically when the secure cloud is connected. You can keep exploring the interactive demo now.'}</Text></Card></Reveal><Reveal delay={170}><MotionPressable onPress={()=>router.replace('/demo')}><LinearGradient colors={['#16B6FF','#0874FF']} style={styles.primary}><Ionicons name="sparkles" size={19} color="white"/><Text style={styles.primaryText}>{locale==='he'?'פתיחת הדמו':'Open interactive demo'}</Text></LinearGradient></MotionPressable></Reveal></Screen>;
  }

  if(live.loading){return <Screen><Logo/><View style={styles.loading}><ActivityIndicator size="large" color={colors.cyan}/><Text style={styles.sub}>Loading your private family circle…</Text></View></Screen>}

  return <Screen>
    <Reveal><View style={[styles.top,isRTL&&{flexDirection:'row-reverse'}]}><Logo/><View style={[styles.livePill,{borderColor:live.connected?'rgba(45,227,154,.35)':'rgba(255,157,66,.35)'}]}><View style={styles.liveDotWrap}>{live.connected?<PulseRing color={colors.green} size={25}/>:null}<View style={[styles.dot,{backgroundColor:live.connected?colors.green:colors.orange}]}/></View><Text style={[styles.liveText,{color:live.connected?'#9AF0CB':'#FFD09D'}]}>{live.connected?'LIVE':'CONNECTING'}</Text></View></View></Reveal>

    <Reveal delay={70}><View style={[styles.headingRow,isRTL&&{flexDirection:'row-reverse'}]}><View style={{flex:1}}><Text style={[styles.kicker,rtl]}>{live.activeSos.length?'ATTENTION NEEDED':'EVERYONE IS SAFE'}</Text><Text style={[styles.title,rtl]}>{live.family?.name||'Your family'}</Text></View><MotionPressable onPress={()=>router.push('/parent/pair')} style={styles.add}><Ionicons name="person-add" size={20} color={colors.cyan}/></MotionPressable></View></Reveal>

    {live.activeSos.length>0?<Reveal delay={105}><MotionPressable onPress={()=>router.push('/sos')} feedback={false}><LinearGradient colors={['#5B1724','#2D111A']} style={styles.sosBanner}><View style={styles.sosIcon}><Ionicons name="alert" size={23} color="white"/></View><View style={{flex:1}}><Text style={styles.sosTitle}>Emergency SOS active</Text><Text style={styles.sosSub}>{live.activeSos.length} active alert{live.activeSos.length>1?'s':''} in your family circle</Text></View><Ionicons name="chevron-forward" size={20} color="#FFB8C1"/></LinearGradient></MotionPressable></Reveal>:null}

    <Reveal delay={135}><View style={styles.mapCard}>
      <View style={styles.mapGrid}/><View style={styles.mapGrid2}/><View style={styles.mapRoad}/><View style={styles.mapRoad2}/><AnimatedRoute/>
      <View style={styles.mapHeader}><View style={styles.protected}><Ionicons name="shield-checkmark" size={15} color={colors.green}/><Text style={styles.protectedText}>Private family map</Text></View><View style={styles.layers}><Ionicons name="layers" size={18} color="#CDEEFF"/></View></View>
      <View style={styles.mapMembers}>{live.members.slice(0,4).map((m,i)=><MapMarker key={m.id} member={m} index={i}/>)}</View>
      <View style={styles.mapFooter}><Ionicons name="lock-closed" size={13} color={colors.green}/><Text style={styles.mapFooterText}>Family-only • realtime updates • RLS protected</Text></View>
    </View></Reveal>

    <Reveal delay={210}><View style={styles.actions}>
      <Action icon="person-add" label="Add member" color={colors.cyan} bg="rgba(10,140,255,.14)" onPress={()=>router.push('/parent/pair')}/>
      <Action icon="alert-circle" label="SOS" color="#FF7284" bg="rgba(255,68,91,.13)" onPress={()=>router.push('/sos')}/>
      <Action icon="language" label="Language" color="#A697FF" bg="rgba(124,103,255,.13)" onPress={()=>router.push('/language')}/>
      <Action icon="diamond" label="AGAM Plus" color={colors.cyan} bg="rgba(54,197,255,.12)" onPress={()=>router.push('/plans')}/>
    </View></Reveal>

    <Text style={[styles.section,rtl]}>Family members</Text>
    {live.members.map((m,i)=><Reveal key={m.id} delay={250+i*55}><MotionPressable onPress={()=>{}} style={styles.memberPress}><Card style={styles.memberCard}><LinearGradient colors={[avatarColors[i%avatarColors.length], '#12324A']} style={styles.avatar}><Text style={styles.avatarText}>{m.display_name?.slice(0,1).toUpperCase()||'?'}</Text></LinearGradient><View style={{flex:1}}><View style={styles.nameRow}><Text style={[styles.memberName,rtl]}>{m.display_name}</Text><Text style={styles.role}>{m.role.toUpperCase()}</Text></View><Text style={[styles.memberSub,rtl]}>{m.latestLocation?`${m.latestLocation.latitude.toFixed(4)}, ${m.latestLocation.longitude.toFixed(4)} • ${ago(m.latestLocation.recorded_at)}`:'Waiting for first location update'}</Text></View><Ionicons name="chevron-forward" size={19} color={colors.muted}/></Card></MotionPressable></Reveal>)}

    {live.error?<Card style={styles.error}><Ionicons name="warning" size={19} color="#FF9D42"/><Text style={styles.errorText}>{live.error}</Text></Card>:null}
    <Text style={styles.footer}>AGAM Family • private by design • monitoring indicators remain visible on family-member devices</Text>
  </Screen>;
}

const styles=StyleSheet.create({
  top:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},livePill:{flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:10,paddingVertical:7,borderRadius:999,borderWidth:1,backgroundColor:'#081B2D'},liveDotWrap:{width:17,height:17,alignItems:'center',justifyContent:'center'},dot:{width:7,height:7,borderRadius:99},liveText:{fontSize:9,fontWeight:'900',letterSpacing:1},headingRow:{flexDirection:'row',alignItems:'center',gap:12},kicker:{color:colors.green,fontSize:10,fontWeight:'900',letterSpacing:1.1},title:{color:'white',fontSize:27,fontWeight:'900',marginTop:3},sub:{color:colors.muted,fontSize:12,lineHeight:18,textAlign:'center'},add:{width:44,height:44,borderRadius:14,backgroundColor:'#0B2137',borderWidth:1,borderColor:'#245278',alignItems:'center',justifyContent:'center'},center:{alignItems:'center',gap:10,paddingVertical:26},primary:{height:56,borderRadius:17,flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center'},primaryText:{color:'white',fontWeight:'900'},loading:{flex:1,minHeight:360,alignItems:'center',justifyContent:'center',gap:12},
  sosBanner:{borderRadius:20,padding:14,flexDirection:'row',alignItems:'center',gap:11,borderWidth:1,borderColor:'rgba(255,68,91,.30)'},sosIcon:{width:44,height:44,borderRadius:14,backgroundColor:'#D7253E',alignItems:'center',justifyContent:'center'},sosTitle:{color:'white',fontWeight:'900',fontSize:13},sosSub:{color:'#FFB6C0',fontSize:10,marginTop:3},
  mapCard:{height:320,borderRadius:28,overflow:'hidden',backgroundColor:'#071A29',borderWidth:1,borderColor:'#1B4B6E',position:'relative'},mapGrid:{position:'absolute',left:-50,right:-50,top:92,height:16,backgroundColor:'#103A56',transform:[{rotate:'-8deg'}]},mapGrid2:{position:'absolute',left:-60,right:-60,top:220,height:12,backgroundColor:'#10344D',transform:[{rotate:'5deg'}]},mapRoad:{position:'absolute',top:-40,bottom:-40,left:120,width:15,backgroundColor:'#123D59',transform:[{rotate:'10deg'}]},mapRoad2:{position:'absolute',top:-40,bottom:-40,right:105,width:10,backgroundColor:'#0D3049',transform:[{rotate:'-7deg'}]},mapHeader:{position:'absolute',left:14,right:14,top:14,flexDirection:'row',justifyContent:'space-between'},protected:{flexDirection:'row',gap:6,alignItems:'center',paddingHorizontal:10,paddingVertical:7,borderRadius:999,backgroundColor:'rgba(4,20,33,.84)',borderWidth:1,borderColor:'rgba(45,227,154,.23)'},protectedText:{color:'#D8F5E9',fontSize:10,fontWeight:'800'},layers:{width:38,height:38,borderRadius:13,backgroundColor:'rgba(4,20,33,.85)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#24506E'},mapMembers:{position:'absolute',inset:0},mapMember:{position:'absolute',flexDirection:'row',alignItems:'center',gap:6},markerPulse:{width:50,height:50,alignItems:'center',justifyContent:'center'},marker:{width:42,height:42,borderRadius:99,borderWidth:3,borderColor:'white',alignItems:'center',justifyContent:'center'},markerText:{color:'white',fontWeight:'900'},markerLabel:{backgroundColor:'rgba(5,20,34,.90)',borderRadius:10,paddingHorizontal:8,paddingVertical:5,borderWidth:1,borderColor:'#24516F'},markerName:{color:'white',fontSize:10,fontWeight:'900'},markerTime:{color:colors.muted,fontSize:8,marginTop:1},mapFooter:{position:'absolute',bottom:12,left:14,right:14,flexDirection:'row',gap:6,alignItems:'center',backgroundColor:'rgba(4,18,31,.84)',paddingHorizontal:10,paddingVertical:7,borderRadius:12},mapFooterText:{color:'#91ABC0',fontSize:9},
  actions:{flexDirection:'row',justifyContent:'space-between',gap:7},action:{flex:1,alignItems:'center',gap:6},actionIcon:{width:46,height:46,borderRadius:15,alignItems:'center',justifyContent:'center'},actionText:{color:'#C9D9E7',fontSize:9,fontWeight:'700',textAlign:'center'},section:{color:'white',fontSize:16,fontWeight:'900',marginTop:4},memberPress:{borderRadius:22},memberCard:{flexDirection:'row',alignItems:'center',gap:11,padding:13},avatar:{width:47,height:47,borderRadius:99,alignItems:'center',justifyContent:'center'},avatarText:{color:'white',fontWeight:'900',fontSize:17},nameRow:{flexDirection:'row',alignItems:'center',gap:7},memberName:{color:'white',fontWeight:'900',fontSize:13},role:{color:colors.cyan,fontSize:7,fontWeight:'900',letterSpacing:.7},memberSub:{color:colors.muted,fontSize:9,marginTop:4},error:{flexDirection:'row',gap:8,alignItems:'flex-start',borderColor:'rgba(255,157,66,.35)'},errorText:{color:'#FFD1A4',fontSize:10,lineHeight:15,flex:1},footer:{color:'#5D7489',fontSize:8,lineHeight:13,textAlign:'center',paddingHorizontal:16}
});
