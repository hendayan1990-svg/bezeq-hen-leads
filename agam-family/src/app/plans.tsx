import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BackButton, Card, Logo, Screen } from '../components/BrandShell';
import { colors } from '../lib/theme';
import { apiConfigured, getFamily } from '../lib/api';
import { useLocale } from '../lib/locale';
import { MotionPressable, Reveal } from '../components/Motion';

const freeFeatures=['2 family members','2 Safe Places','24-hour location history','SOS & check-in','Battery and connection status'];
const plusFeatures=['Up to 6 family members','Unlimited Safe Places','30-day location history','Safety Audio requests','Safe Walk','Priority safety alerts','Multiple guardians'];

export default function PlansScreen(){
  const {locale,isRTL}=useLocale(); const [billing,setBilling]=useState<'annual'|'monthly'>('annual'); const [plan,setPlan]=useState('free'); const [message,setMessage]=useState('');
  const he=locale==='he'; const rtl:any=isRTL?{textAlign:'right',writingDirection:'rtl'}:undefined;
  useEffect(()=>{if(apiConfigured())getFamily().then((x:any)=>setPlan(x?.family?.plan||'free')).catch(()=>{})},[]);
  const monthly=billing==='annual'?'$4.17':'$5.99';
  return <Screen>
    <View style={[styles.top,isRTL&&{flexDirection:'row-reverse'}]}><BackButton onPress={()=>router.back()}/><Logo compact/><View style={{width:44}}/></View>
    <Reveal delay={30}><View style={styles.hero}><View style={styles.diamond}><Ionicons name="diamond" size={26} color="#7D5CE8"/></View><Text style={[styles.eyebrow,rtl]}>AGAM FAMILY PLUS</Text><Text style={[styles.title,rtl]}>{he?'יותר הגנה. יותר שקט.':'More protection. More peace of mind.'}</Text><Text style={[styles.sub,rtl]}>{he?'כלים מתקדמים למשפחה, בלי להעמיס על החוויה.':'Advanced family safety tools in one simple experience.'}</Text></View></Reveal>

    <View style={styles.segment}><Pressable onPress={()=>setBilling('annual')} style={[styles.segmentItem,billing==='annual'&&styles.segmentActive]}><Text style={[styles.segmentText,billing==='annual'&&styles.segmentTextActive]}>{he?'שנתי':'Annual'}</Text>{billing==='annual'?<Text style={styles.save}>SAVE 30%</Text>:null}</Pressable><Pressable onPress={()=>setBilling('monthly')} style={[styles.segmentItem,billing==='monthly'&&styles.segmentActive]}><Text style={[styles.segmentText,billing==='monthly'&&styles.segmentTextActive]}>{he?'חודשי':'Monthly'}</Text></Pressable></View>

    <Reveal delay={80}><Card style={styles.freeCard}><View style={[styles.planTop,isRTL&&{flexDirection:'row-reverse'}]}><View style={{flex:1}}><Text style={[styles.planName,rtl]}>Free</Text><Text style={[styles.planDesc,rtl]}>{he?'בטיחות חיונית למשפחה קטנה':'Essential family safety'}</Text></View><Text style={styles.price}>$0</Text></View>{freeFeatures.map(x=><Feature key={x} text={x}/>) }{plan==='free'?<View style={styles.current}><Text style={styles.currentText}>{he?'התוכנית הנוכחית':'CURRENT PLAN'}</Text></View>:null}</Card></Reveal>

    <Reveal delay={140}><LinearGradient colors={['#F3EEFF','#E8F7FF','#ECFFF8']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.plusCard}>
      <View style={styles.best}><Ionicons name="sparkles" size={12} color="#6545C7"/><Text style={styles.bestText}>{he?'מומלץ':'BEST VALUE'}</Text></View>
      <View style={[styles.planTop,isRTL&&{flexDirection:'row-reverse'}]}><View style={{flex:1}}><Text style={[styles.plusName,rtl]}>Family Plus</Text><Text style={[styles.plusDesc,rtl]}>{he?'הגנה מתקדמת לכל המשפחה':'Advanced protection for everyone'}</Text></View><View style={{alignItems:'flex-end'}}><Text style={styles.plusPrice}>{monthly}</Text><Text style={styles.per}>{he?'לחודש':'/ month'}</Text></View></View>
      {billing==='annual'?<Text style={[styles.billNote,rtl]}>{he?'$49.99 לשנה לאחר תקופת הניסיון':'$49.99 billed yearly after trial'}</Text>:<Text style={[styles.billNote,rtl]}>{he?'$5.99 בחודש לאחר תקופת הניסיון':'$5.99 billed monthly after trial'}</Text>}
      <View style={styles.featureBlock}>{plusFeatures.map(x=><Feature key={x} text={x}/>)}</View>
      <MotionPressable onPress={()=>setMessage(he?'הרכישה תופעל לאחר חיבור מוצרי החנויות.':'Store purchase activates after App Store and Google Play products are connected.')}>
        <LinearGradient colors={['#8A6CFF','#6D54DF']} style={styles.trial}><Text style={styles.trialText}>{plan==='plus'?(he?'Plus פעיל':'PLUS ACTIVE'):(he?'התחלת 7 ימי ניסיון':'START 7-DAY FREE TRIAL')}</Text></LinearGradient>
      </MotionPressable>
      <Text style={styles.cancel}>{he?'אפשר לבטל בכל עת':'Cancel anytime'}</Text>
    </LinearGradient></Reveal>

    {message?<Card style={styles.notice}><Ionicons name="information-circle" size={20} color={colors.blue}/><Text style={[styles.noticeText,rtl]}>{message}</Text></Card>:null}
    <Text style={[styles.legal,rtl]}>{he?'המנוי מתחדש אוטומטית עד לביטול. המחיר הסופי נקבע לפי החנות והאזור.':'Subscriptions renew automatically until cancelled. Final pricing is determined by store and region.'}</Text>
  </Screen>;
}
function Feature({text}:{text:string}){return <View style={styles.feature}><Ionicons name="checkmark-circle" size={18} color={colors.green}/><Text style={styles.featureText}>{text}</Text></View>}
const styles=StyleSheet.create({top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},hero:{alignItems:'center',gap:7,paddingVertical:8},diamond:{width:58,height:58,borderRadius:20,backgroundColor:'#F1ECFF',alignItems:'center',justifyContent:'center'},eyebrow:{color:'#7355D8',fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:colors.navy,fontSize:27,fontWeight:'900',textAlign:'center'},sub:{color:colors.muted,fontSize:12,lineHeight:18,textAlign:'center',maxWidth:430},segment:{height:48,borderRadius:17,backgroundColor:'#EDF4F8',borderWidth:1,borderColor:'#DCE8EF',flexDirection:'row',padding:4},segmentItem:{flex:1,alignItems:'center',justifyContent:'center',borderRadius:13,flexDirection:'row',gap:7},segmentActive:{backgroundColor:'#FFFFFF',shadowColor:'#2D6B90',shadowOpacity:.08,shadowRadius:9,elevation:1},segmentText:{color:'#7B8FA1',fontSize:11,fontWeight:'900'},segmentTextActive:{color:colors.navy},save:{fontSize:7,color:colors.green,fontWeight:'900',backgroundColor:colors.softMint,paddingHorizontal:5,paddingVertical:3,borderRadius:6},freeCard:{padding:18},planTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10},planName:{color:colors.navy,fontSize:20,fontWeight:'900'},planDesc:{color:colors.muted,fontSize:10,marginTop:3},price:{color:colors.navy,fontSize:26,fontWeight:'900'},feature:{flexDirection:'row',gap:8,alignItems:'center',marginVertical:4},featureText:{color:'#456078',fontSize:11},current:{alignSelf:'flex-start',marginTop:10,paddingHorizontal:9,paddingVertical:5,borderRadius:999,backgroundColor:colors.softMint,borderWidth:1,borderColor:'#CBEFE3'},currentText:{color:'#12966D',fontSize:8,fontWeight:'900'},plusCard:{borderRadius:26,padding:19,gap:8,borderWidth:1,borderColor:'#DDD5FA',position:'relative',overflow:'hidden'},best:{position:'absolute',top:0,right:18,flexDirection:'row',gap:4,alignItems:'center',backgroundColor:'#E7DEFF',paddingHorizontal:9,paddingVertical:6,borderBottomLeftRadius:10,borderBottomRightRadius:10},bestText:{color:'#6545C7',fontSize:7,fontWeight:'900'},plusName:{color:'#4A3495',fontSize:21,fontWeight:'900'},plusDesc:{color:'#786E98',fontSize:10,marginTop:3},plusPrice:{color:'#4A3495',fontSize:25,fontWeight:'900'},per:{color:'#857AA8',fontSize:8},billNote:{color:'#84799F',fontSize:9,marginTop:-4},featureBlock:{marginVertical:5},trial:{height:52,borderRadius:16,alignItems:'center',justifyContent:'center',marginTop:5},trialText:{color:'white',fontWeight:'900',fontSize:12},cancel:{textAlign:'center',color:'#82789E',fontSize:8},notice:{flexDirection:'row',gap:9,alignItems:'flex-start'},noticeText:{color:'#4C657B',fontSize:10,lineHeight:15,flex:1},legal:{color:'#879AAA',fontSize:8,lineHeight:13,textAlign:'center',paddingHorizontal:12}});
