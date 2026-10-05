import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedRoute, Floating, PulseRing } from './Motion';
import { colors } from '../lib/theme';

const spots=[{l:'13%',t:'29%'},{l:'57%',t:'19%'},{l:'24%',t:'62%'},{l:'66%',t:'64%'}];
const pinColors=['#18C98F','#8A6CFF','#FFA544','#0A8CFF'];

export default function NativeFamilyMap({ members=[] }: { members?: any[] }) {
  const data=members.length?members:[
    {display_name:'Noa',latestLocation:{recorded_at:new Date().toISOString()}},
    {display_name:'Dad',latestLocation:{recorded_at:new Date().toISOString()}},
    {display_name:'Liam',latestLocation:{recorded_at:new Date().toISOString()}},
  ];
  return <View style={styles.map}>
    <Svg viewBox="0 0 400 320" width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Rect width="400" height="320" rx="28" fill="#F2FAF8"/>
      <Path d="M-20 70 C80 28 116 112 212 72 C302 34 350 68 430 35" stroke="#DDECEF" strokeWidth="22" fill="none" strokeLinecap="round"/>
      <Path d="M-20 224 C62 185 120 254 202 216 C286 177 339 158 430 190" stroke="#D9E9EA" strokeWidth="18" fill="none" strokeLinecap="round"/>
      <Path d="M92 -30 C123 75 74 156 138 355" stroke="#E2EEF0" strokeWidth="15" fill="none" strokeLinecap="round"/>
      <Path d="M297 -30 C262 76 307 178 266 355" stroke="#DFECEE" strokeWidth="13" fill="none" strokeLinecap="round"/>
      <Path d="M-20 140 L430 132" stroke="#EAF2F3" strokeWidth="7"/>
      <Path d="M-20 277 L430 247" stroke="#E8F1F2" strokeWidth="7"/>
      <G><Circle cx="318" cy="88" r="55" fill="#20CF9B" opacity=".10"/><Circle cx="318" cy="88" r="37" fill="#20CF9B" opacity=".08"/><Circle cx="318" cy="88" r="12" fill="#20CF9B" opacity=".18"/></G>
      <G><Circle cx="92" cy="236" r="44" fill="#0A8CFF" opacity=".08"/><Circle cx="92" cy="236" r="30" fill="#0A8CFF" opacity=".07"/></G>
    </Svg>
    <AnimatedRoute color="#169DFF"/>

    <View style={styles.topRow}>
      <View style={styles.safeChip}><Ionicons name="shield-checkmark" size={15} color={colors.green}/><Text style={styles.safeText}>Family protected</Text></View>
      <View style={styles.tools}><View style={styles.tool}><Ionicons name="layers" size={18} color={colors.navy}/></View><View style={styles.tool}><Ionicons name="locate" size={18} color={colors.blue}/></View></View>
    </View>

    <View style={styles.safeZone}><View style={styles.safeZoneInner}><Ionicons name="home" size={21} color={colors.green}/><Text style={styles.safeZoneText}>HOME</Text></View></View>

    {data.slice(0,4).map((m,i)=>{
      const p=spots[i]; const c=pinColors[i%pinColors.length]; const n=(m.display_name||'?').slice(0,1).toUpperCase();
      return <Floating key={m.id||m.display_name||i} delay={i*120} distance={5+(i%2)*2} style={[styles.pinWrap,{left:p.l,top:p.t}]}> 
        <View style={styles.pinAnchor}><PulseRing color={c} size={58}/><View style={[styles.pin,{borderColor:c}]}><View style={[styles.pinInner,{backgroundColor:c}]}><Text style={styles.pinInitial}>{n}</Text></View></View></View>
        <View style={styles.label}><Text style={styles.name}>{m.display_name||'Family'}</Text><Text style={styles.time}>{i===0?'Now':`${i+1} min ago`}</Text></View>
      </Floating>;
    })}

    <View style={styles.bottomChip}><View style={styles.liveDot}/><Text style={styles.bottomText}>Live family map</Text><Text style={styles.secure}>Encrypted</Text></View>
  </View>;
}

const styles=StyleSheet.create({
  map:{height:345,borderRadius:30,overflow:'hidden',borderWidth:1,borderColor:'#D4E6EC',backgroundColor:'#F2FAF8',shadowColor:'#27688F',shadowOpacity:.10,shadowRadius:20,shadowOffset:{width:0,height:10},elevation:3,position:'relative'},topRow:{position:'absolute',top:13,left:13,right:13,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},safeChip:{height:36,paddingHorizontal:11,borderRadius:999,backgroundColor:'rgba(255,255,255,.94)',borderWidth:1,borderColor:'#DDEBEF',flexDirection:'row',gap:6,alignItems:'center'},safeText:{color:colors.navy,fontSize:9,fontWeight:'900'},tools:{gap:7},tool:{width:37,height:37,borderRadius:13,backgroundColor:'rgba(255,255,255,.95)',borderWidth:1,borderColor:'#DCEAF0',alignItems:'center',justifyContent:'center'},safeZone:{position:'absolute',right:21,top:63,width:106,height:106,borderRadius:999,borderWidth:1.5,borderColor:'rgba(24,201,143,.36)',backgroundColor:'rgba(24,201,143,.08)',alignItems:'center',justifyContent:'center'},safeZoneInner:{width:58,height:58,borderRadius:999,backgroundColor:'rgba(255,255,255,.92)',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(24,201,143,.20)'},safeZoneText:{fontSize:7,fontWeight:'900',color:'#3C8F74',marginTop:2},pinWrap:{position:'absolute',flexDirection:'row',alignItems:'center',gap:5},pinAnchor:{width:48,height:48,alignItems:'center',justifyContent:'center'},pin:{width:44,height:44,borderRadius:999,borderWidth:3,backgroundColor:'white',alignItems:'center',justifyContent:'center',shadowColor:'#24688E',shadowOpacity:.18,shadowRadius:9,elevation:2},pinInner:{width:34,height:34,borderRadius:999,alignItems:'center',justifyContent:'center'},pinInitial:{color:'white',fontWeight:'900',fontSize:14},label:{backgroundColor:'rgba(255,255,255,.95)',borderRadius:11,paddingHorizontal:8,paddingVertical:5,borderWidth:1,borderColor:'#DDE9EE',shadowColor:'#27688F',shadowOpacity:.08,shadowRadius:7},name:{color:colors.navy,fontSize:9,fontWeight:'900'},time:{color:colors.muted,fontSize:7,marginTop:1},bottomChip:{position:'absolute',left:12,right:12,bottom:11,height:34,borderRadius:12,backgroundColor:'rgba(255,255,255,.93)',borderWidth:1,borderColor:'#DCE9EE',flexDirection:'row',alignItems:'center',paddingHorizontal:10,gap:6},liveDot:{width:7,height:7,borderRadius:99,backgroundColor:colors.green},bottomText:{color:colors.navy,fontSize:9,fontWeight:'800',flex:1},secure:{color:colors.green,fontSize:8,fontWeight:'900'}
});
