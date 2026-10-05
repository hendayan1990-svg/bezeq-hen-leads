import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AnimatedBrandMark, Floating, MotionPressable, PulseRing, Reveal } from '../components/Motion';
import { colors } from '../lib/theme';
import { useFeedback } from '../lib/feedback';
import { useLocale } from '../lib/locale';

const copy:any = {
  en: [
    ['Your family, always close','See everyone in one private family circle with clear safety status.'],
    ['Live location that feels alive','Animated pins, recent updates and Safe Places help you understand what is happening at a glance.'],
    ['SOS when every second matters','A clear emergency action alerts approved family members with location and device status.'],
  ],
  he: [
    ['המשפחה שלך, תמיד קרובה','רואים את כולם במעגל משפחתי פרטי אחד עם מצב בטיחות ברור.'],
    ['מיקום חי שמרגיש באמת חי','סמני מיקום מונפשים, עדכונים אחרונים ואזורים בטוחים נותנים תמונה ברורה במבט אחד.'],
    ['SOS כשכל שנייה חשובה','פעולת חירום ברורה מתריעה לבני המשפחה המאושרים עם מיקום ומצב המכשיר.'],
  ],
};

function FamilyScene(){
  return <View style={styles.scene}><AnimatedBrandMark size={122}/><View style={styles.familyRow}>
    {['#2DE39A','#7C67FF','#FF9D42'].map((c,i)=><Floating key={c} delay={i*100} duration={1300+i*180}><View style={[styles.avatar,{borderColor:c}]}><Ionicons name={i===0?'man':'person'} size={25} color="white"/></View></Floating>)}
  </View></View>;
}

function MapScene(){
  const pins=[{l:'18%',t:'58%',c:'#2DE39A'},{l:'48%',t:'27%',c:'#36C5FF'},{l:'69%',t:'64%',c:'#FF9D42'}] as any[];
  return <View style={[styles.scene,styles.map]}><View style={styles.road}/><View style={[styles.road,{transform:[{rotate:'-38deg'}],top:125}]}/>
    {pins.map((p,i)=><Floating key={i} distance={i===1?9:5} duration={1200+i*180} style={{position:'absolute',left:p.l,top:p.t}}><View style={{alignItems:'center',justifyContent:'center'}}><PulseRing color={p.c} size={62}/><LinearGradient colors={[p.c,'#0874FF']} style={styles.pin}><Ionicons name="person" size={19} color="white"/></LinearGradient></View></Floating>)}
    <View style={styles.safeZone}><Ionicons name="home" size={24} color="#BCEBFF"/><Text style={styles.safeText}>SAFE PLACE</Text></View>
  </View>;
}

function SosScene(){
  return <View style={styles.scene}><View style={styles.sosWrap}><PulseRing color="#FF445B" size={190}/><PulseRing color="#FF8A99" size={235}/><LinearGradient colors={['#FF5368','#CF1734']} style={styles.sos}><Ionicons name="alert" size={38} color="white"/><Text style={styles.sosLabel}>SOS</Text></LinearGradient></View></View>;
}

export default function TourScreen(){
  const { locale, isRTL }=useLocale();
  const { tap, success }=useFeedback();
  const [step,setStep]=useState(0);
  const text=(copy[locale]||copy.en)[step];
  const Scene=useMemo(()=>[FamilyScene,MapScene,SosScene][step],[step]);
  const next=()=>{
    if(step<2){tap();setStep(x=>x+1);}else{success();router.replace('/');}
  };
  return <LinearGradient colors={['#F9FCFF','#EEF8FF','#FFFFFF']} style={styles.app}><SafeAreaView style={styles.safe}>
    <View style={[styles.top,isRTL&&{flexDirection:'row-reverse'}]}><Text style={styles.brand}>AGAM <Text style={{color:'#0874FF'}}>Family</Text></Text><MotionPressable onPress={()=>router.replace('/')} style={styles.skip}><Text style={styles.skipText}>{locale==='he'?'דלג':'Skip'}</Text></MotionPressable></View>
    <View style={styles.progress}>{[0,1,2].map(i=><View key={i} style={[styles.dot,i===step&&styles.dotActive]}/>)}</View>
    <Animated.View key={`scene-${step}`} entering={FadeIn.duration(380)} exiting={FadeOut.duration(180)} style={styles.visual}><Scene/></Animated.View>
    <Reveal delay={80} style={styles.copy}><Text style={[styles.title,isRTL&&styles.rtl]}>{text[0]}</Text><Text style={[styles.sub,isRTL&&styles.rtl]}>{text[1]}</Text></Reveal>
    <Reveal delay={170}><MotionPressable onPress={next}><LinearGradient colors={['#18B8FF','#0874FF']} style={styles.next}><Text style={styles.nextText}>{step===2?(locale==='he'?'מתחילים':'Get started'):(locale==='he'?'המשך':'Continue')}</Text><Ionicons name={isRTL?'arrow-back':'arrow-forward'} size={21} color="white"/></LinearGradient></MotionPressable></Reveal>
  </SafeAreaView></LinearGradient>;
}

const styles=StyleSheet.create({app:{flex:1},safe:{flex:1,padding:22},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},brand:{fontSize:22,fontWeight:'900',color:'#09265B'},skip:{paddingHorizontal:15,paddingVertical:9,borderRadius:999,backgroundColor:'rgba(8,116,255,.08)'},skipText:{color:'#0874FF',fontWeight:'800'},progress:{flexDirection:'row',gap:7,justifyContent:'center',marginTop:17},dot:{width:8,height:8,borderRadius:9,backgroundColor:'#CFDDED'},dotActive:{width:34,backgroundColor:'#0874FF'},visual:{flex:1,minHeight:320,alignItems:'center',justifyContent:'center'},scene:{width:'100%',height:310,alignItems:'center',justifyContent:'center'},familyRow:{flexDirection:'row',gap:18,marginTop:26},avatar:{width:62,height:62,borderRadius:99,backgroundColor:'#163F72',borderWidth:4,alignItems:'center',justifyContent:'center',shadowColor:'#0874FF',shadowOpacity:.2,shadowRadius:15},map:{borderRadius:38,backgroundColor:'#EEF8F6',overflow:'hidden',borderWidth:1,borderColor:'#D8E9EF'},road:{position:'absolute',left:-50,right:-50,top:205,height:18,backgroundColor:'#D9E4E7',transform:[{rotate:'16deg'}]},pin:{width:46,height:46,borderRadius:99,borderWidth:4,borderColor:'white',alignItems:'center',justifyContent:'center'},safeZone:{position:'absolute',left:'18%',top:'25%',width:92,height:92,borderRadius:99,borderWidth:2,borderColor:'#9DD7F6',backgroundColor:'rgba(8,116,255,.08)',alignItems:'center',justifyContent:'center'},safeText:{fontSize:8,fontWeight:'900',color:'#3377A0',marginTop:4},sosWrap:{alignItems:'center',justifyContent:'center'},sos:{width:150,height:150,borderRadius:99,alignItems:'center',justifyContent:'center',shadowColor:'#FF445B',shadowOpacity:.45,shadowRadius:35},sosLabel:{color:'white',fontSize:30,fontWeight:'900',marginTop:4},copy:{gap:10,marginBottom:24},title:{fontSize:31,lineHeight:37,fontWeight:'900',color:'#09265B',textAlign:'center'},sub:{fontSize:14,lineHeight:21,color:'#64809B',textAlign:'center',paddingHorizontal:10},rtl:{textAlign:'right',writingDirection:'rtl'},next:{height:60,borderRadius:19,flexDirection:'row',gap:9,alignItems:'center',justifyContent:'center'},nextText:{color:'white',fontSize:16,fontWeight:'900'}});
