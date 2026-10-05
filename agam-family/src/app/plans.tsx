import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BackButton, Card, Logo, Screen } from '../components/BrandShell';
import { colors } from '../lib/theme';
import { apiConfigured, getFamily } from '../lib/api';
import { useLocale } from '../lib/locale';

const freeFeatures=['2 family members','2 Safe Places','24-hour location history','SOS & check-in','Battery and connection status'];
const plusFeatures=['Up to 6 family members','Unlimited Safe Places','30-day location history','Safety Audio requests','Safe Walk','Priority safety alerts','Multiple guardians'];

export default function PlansScreen(){
  const {locale,isRTL}=useLocale(); const [billing,setBilling]=useState<'annual'|'monthly'>('annual'); const [plan,setPlan]=useState('free'); const [message,setMessage]=useState('');
  const he=locale==='he'; const rtl:any=isRTL?{textAlign:'right',writingDirection:'rtl'}:undefined;
  useEffect(()=>{if(apiConfigured())getFamily().then((x:any)=>setPlan(x?.family?.plan||'free')).catch(()=>{})},[]);
  const monthly=billing==='annual'?'$4.17':'$5.99';
  return <Screen>
    <BackButton onPress={()=>router.back()}/><Logo compact/>
    <View style={styles.hero}><Ionicons name="sparkles" size={30} color="#BDEBFF"/><Text style={[styles.eyebrow,rtl]}>AGAM FAMILY PLUS</Text><Text style={[styles.title,rtl]}>{he?'יותר הגנה. פחות דאגה.':'More protection. Less worry.'}</Text><Text style={[styles.sub,rtl]}>{he?'הרחיבו את ההיסטוריה, האזורים הבטוחים וכלי הבטיחות לכל המשפחה.':'Unlock deeper history, unlimited safe places and advanced family safety tools.'}</Text></View>

    <View style={styles.segment}><Pressable onPress={()=>setBilling('annual')} style={[styles.segmentItem,billing==='annual'&&styles.segmentActive]}><Text style={styles.segmentText}>{he?'שנתי':'Annual'}</Text>{billing==='annual'?<Text style={styles.save}>SAVE 30%</Text>:null}</Pressable><Pressable onPress={()=>setBilling('monthly')} style={[styles.segmentItem,billing==='monthly'&&styles.segmentActive]}><Text style={styles.segmentText}>{he?'חודשי':'Monthly'}</Text></Pressable></View>

    <Card style={styles.freeCard}><View style={[styles.planTop,isRTL&&{flexDirection:'row-reverse'}]}><View><Text style={[styles.planName,rtl]}>Free</Text><Text style={[styles.planDesc,rtl]}>{he?'כלי בטיחות חיוניים למשפחה קטנה':'Essential safety for a small family'}</Text></View><Text style={styles.price}>$0</Text></View>{freeFeatures.map(x=><Feature key={x} text={x}/>) }{plan==='free'?<View style={styles.current}><Text style={styles.currentText}>{he?'התוכנית הנוכחית':'CURRENT PLAN'}</Text></View>:null}</Card>

    <LinearGradient colors={['#0C64CF','#09386C']} style={styles.plusCard}>
      <View style={styles.best}><Ionicons name="diamond" size={13} color="#062444"/><Text style={styles.bestText}>{he?'הכי משתלם':'BEST VALUE'}</Text></View>
      <View style={[styles.planTop,isRTL&&{flexDirection:'row-reverse'}]}><View><Text style={[styles.plusName,rtl]}>Family Plus</Text><Text style={[styles.plusDesc,rtl]}>{he?'הגנה מתקדמת לכל המשפחה':'Advanced protection for the whole family'}</Text></View><View style={{alignItems:'flex-end'}}><Text style={styles.plusPrice}>{monthly}</Text><Text style={styles.per}>{he?'לחודש':'/ month'}</Text></View></View>
      {billing==='annual'?<Text style={[styles.billNote,rtl]}>{he?'$49.99 לשנה לאחר תקופת הניסיון':'$49.99 billed yearly after trial'}</Text>:<Text style={[styles.billNote,rtl]}>{he?'$5.99 בחודש לאחר תקופת הניסיון':'$5.99 billed monthly after trial'}</Text>}
      <View style={styles.featureBlock}>{plusFeatures.map(x=><Feature key={x} text={x} light/>)}</View>
      <Pressable onPress={()=>setMessage(he?'רכישה בחנות תופעל כשמוצרי App Store ו-Google Play יחוברו.':'Store purchase will activate after the App Store and Google Play products are connected.')} style={styles.trial}><Text style={styles.trialText}>{plan==='plus'?(he?'Plus פעיל':'PLUS ACTIVE'):(he?'התחלת 7 ימי ניסיון':'START 7-DAY FREE TRIAL')}</Text></Pressable>
      <Text style={styles.cancel}>{he?'אפשר לבטל בכל עת':'Cancel anytime'}</Text>
    </LinearGradient>

    {message?<Card style={styles.notice}><Ionicons name="information-circle" size={20} color={colors.cyan}/><Text style={[styles.noticeText,rtl]}>{message}</Text></Card>:null}
    <Text style={[styles.legal,rtl]}>{he?'המנוי מתחדש אוטומטית עד לביטול. המחיר הסופי, המטבע והמיסים נקבעים על ידי החנות והאזור.':'Subscriptions renew automatically until cancelled. Final price, currency and taxes are determined by the store and region.'}</Text>
  </Screen>;
}
function Feature({text,light=false}:{text:string;light?:boolean}){return <View style={styles.feature}><Ionicons name="checkmark-circle" size={18} color={light?'#75FFBE':colors.green}/><Text style={[styles.featureText,light&&{color:'#EAF6FF'}]}>{text}</Text></View>}
const styles=StyleSheet.create({hero:{alignItems:'center',gap:7,paddingVertical:6},eyebrow:{color:colors.cyan,fontSize:10,fontWeight:'900',letterSpacing:1.2},title:{color:'white',fontSize:28,fontWeight:'900',textAlign:'center'},sub:{color:colors.muted,fontSize:12,lineHeight:18,textAlign:'center',maxWidth:430},segment:{height:48,borderRadius:15,backgroundColor:'#081B2D',borderWidth:1,borderColor:'#193B59',flexDirection:'row',padding:4},segmentItem:{flex:1,alignItems:'center',justifyContent:'center',borderRadius:11,flexDirection:'row',gap:7},segmentActive:{backgroundColor:'#123A62'},segmentText:{color:'white',fontSize:11,fontWeight:'900'},save:{fontSize:7,color:colors.green,fontWeight:'900',backgroundColor:'rgba(45,227,154,.10)',paddingHorizontal:5,paddingVertical:3,borderRadius:6},freeCard:{padding:18},planTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10},planName:{color:'white',fontSize:20,fontWeight:'900'},planDesc:{color:colors.muted,fontSize:10,marginTop:3},price:{color:'white',fontSize:26,fontWeight:'900'},feature:{flexDirection:'row',gap:8,alignItems:'center',marginVertical:4},featureText:{color:'#D4E1EC',fontSize:11},current:{alignSelf:'flex-start',marginTop:10,paddingHorizontal:9,paddingVertical:5,borderRadius:999,backgroundColor:'rgba(45,227,154,.10)',borderWidth:1,borderColor:'rgba(45,227,154,.25)'},currentText:{color:colors.green,fontSize:8,fontWeight:'900'},plusCard:{borderRadius:24,padding:19,gap:8,borderWidth:1,borderColor:'rgba(105,197,255,.42)',position:'relative',overflow:'hidden'},best:{position:'absolute',top:0,right:18,flexDirection:'row',gap:4,alignItems:'center',backgroundColor:'#A9E9FF',paddingHorizontal:9,paddingVertical:6,borderBottomLeftRadius:10,borderBottomRightRadius:10},bestText:{color:'#062444',fontSize:7,fontWeight:'900'},plusName:{color:'white',fontSize:21,fontWeight:'900'},plusDesc:{color:'#B9D8EE',fontSize:10,marginTop:3},plusPrice:{color:'white',fontSize:25,fontWeight:'900'},per:{color:'#BBD3E6',fontSize:8},billNote:{color:'#C2DBED',fontSize:9,marginTop:-4},featureBlock:{marginVertical:5},trial:{height:52,borderRadius:15,backgroundColor:'white',alignItems:'center',justifyContent:'center',marginTop:5},trialText:{color:'#074B93',fontWeight:'900',fontSize:12},cancel:{textAlign:'center',color:'#BBD3E6',fontSize:8},notice:{flexDirection:'row',gap:9,alignItems:'flex-start'},noticeText:{color:'#C7E6F7',fontSize:10,lineHeight:15,flex:1},legal:{color:'#657B8F',fontSize:8,lineHeight:13,textAlign:'center',paddingHorizontal:12}});
