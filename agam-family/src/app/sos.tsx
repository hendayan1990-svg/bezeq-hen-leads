import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BackButton, Card, PrimaryButton, Screen, SecondaryButton, Subtitle, Title } from '../components/BrandShell';
import { PulseRing, Reveal } from '../components/Motion';
import { colors } from '../lib/theme';
import { getProfile } from '../lib/session';
import { apiConfigured, getActiveSos, resolveSos } from '../lib/api';

export default function SosInbox() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const profile = await getProfile();
    if (!profile) { router.replace('/'); return; }
    if (profile.kind === 'child') { router.replace('/family/protection'); return; }
    if (!apiConfigured()) {
      setPreview(true);
      setAlerts([{ id:'preview-sos', display_name:'Noa', started_at:new Date().toISOString(), battery_pct:72, latitude:31.8, longitude:34.65 }]);
      return;
    }
    try { const result=await getActiveSos(); setAlerts(result.alerts||[]); }
    catch { setError('Could not load active SOS alerts.'); }
  }

  useEffect(()=>{load();},[]);

  async function resolve(id:string){
    setBusyId(id); setError('');
    try { if(preview)setAlerts(x=>x.filter(a=>a.id!==id)); else { await resolveSos(id); await load(); } }
    catch { setError('Could not resolve the alert.'); }
    finally { setBusyId(null); }
  }

  return <Screen>
    <BackButton onPress={()=>router.back()}/>
    <View style={styles.heading}><Text style={styles.kicker}>AGAM SAFETY CENTER</Text><Title>Emergency center</Title><Subtitle>Active SOS alerts from your private family circle appear here instantly.</Subtitle></View>
    {error?<Text style={styles.error}>{error}</Text>:null}

    {alerts.length===0?<Reveal><Card style={styles.empty}><View style={styles.safeIcon}><Ionicons name="shield-checkmark" size={31} color={colors.green}/></View><Text style={styles.emptyTitle}>Everyone is safe</Text><Text style={styles.emptySub}>There are no active SOS alerts in your family circle.</Text></Card></Reveal>:alerts.map((a,i)=><Reveal key={a.id} delay={i*70}><Card style={styles.card}>
      <View style={styles.alertHead}>
        <View style={styles.pulseWrap}><PulseRing color={colors.red} size={70}/><LinearGradient colors={['#FF6B79','#F13E58']} style={styles.red}><Ionicons name="alert" size={24} color="white"/></LinearGradient></View>
        <View style={{flex:1}}><Text style={styles.name}>{a.display_name||'Family member'}</Text><Text style={styles.time}>SOS active • {new Date(a.started_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</Text></View>
        <View style={styles.live}><View style={styles.liveDot}/><Text style={styles.liveText}>LIVE</Text></View>
      </View>

      <View style={styles.meta}>
        <View style={styles.metaItem}><View style={[styles.metaIcon,{backgroundColor:colors.softMint}]}><Ionicons name="battery-half" size={17} color={colors.green}/></View><View><Text style={styles.metaLabel}>Battery</Text><Text style={styles.metaValue}>{a.battery_pct??'—'}%</Text></View></View>
        <View style={styles.metaItem}><View style={[styles.metaIcon,{backgroundColor:colors.softBlue}]}><Ionicons name="location" size={17} color={colors.blue}/></View><View><Text style={styles.metaLabel}>Location</Text><Text style={styles.metaValue}>{a.latitude!=null?'Received':'Pending'}</Text></View></View>
      </View>

      <View style={styles.locationBox}><Ionicons name="navigate-circle" size={22} color={colors.blue}/><View style={{flex:1}}><Text style={styles.locationTitle}>Live safety location</Text><Text style={styles.locationSub}>{a.latitude!=null?'Location is available for approved guardians.':'Waiting for the family member device.'}</Text></View><Ionicons name="chevron-forward" size={18} color="#9AAEBD"/></View>

      <PrimaryButton label={busyId===a.id?'Resolving…':'Mark as resolved'} icon="checkmark-circle" onPress={()=>resolve(a.id)} disabled={busyId===a.id}/>
      <SecondaryButton label="Back to family dashboard" icon="map" onPress={()=>router.replace('/dashboard')}/>
    </Card></Reveal>)}
  </Screen>;
}

const styles=StyleSheet.create({heading:{gap:6},kicker:{color:colors.red,fontSize:9,fontWeight:'900',letterSpacing:1.1},error:{color:'#B94153',fontSize:11,backgroundColor:'#FFF1F3',padding:10,borderRadius:13},empty:{alignItems:'center',padding:28,gap:8},safeIcon:{width:62,height:62,borderRadius:22,backgroundColor:colors.softMint,alignItems:'center',justifyContent:'center'},emptyTitle:{color:colors.navy,fontSize:18,fontWeight:'900'},emptySub:{color:colors.muted,fontSize:10,textAlign:'center'},card:{gap:14,borderColor:'#FFD2D8'},alertHead:{flexDirection:'row',gap:12,alignItems:'center'},pulseWrap:{width:58,height:58,alignItems:'center',justifyContent:'center'},red:{width:48,height:48,borderRadius:16,alignItems:'center',justifyContent:'center'},name:{color:colors.navy,fontSize:18,fontWeight:'900'},time:{color:'#C06070',fontSize:10,marginTop:3},live:{height:27,paddingHorizontal:8,borderRadius:999,backgroundColor:'#FFF0F2',flexDirection:'row',gap:5,alignItems:'center'},liveDot:{width:6,height:6,borderRadius:99,backgroundColor:colors.red},liveText:{fontSize:7,fontWeight:'900',color:'#C63E53'},meta:{flexDirection:'row',gap:9},metaItem:{flex:1,flexDirection:'row',gap:8,alignItems:'center',padding:10,borderRadius:15,backgroundColor:'#F8FBFD',borderWidth:1,borderColor:'#E3EDF2'},metaIcon:{width:33,height:33,borderRadius:11,alignItems:'center',justifyContent:'center'},metaLabel:{fontSize:8,color:colors.muted,fontWeight:'700'},metaValue:{fontSize:11,color:colors.navy,fontWeight:'900',marginTop:2},locationBox:{minHeight:62,borderRadius:17,backgroundColor:'#F2F8FF',borderWidth:1,borderColor:'#D8E8F5',flexDirection:'row',gap:9,alignItems:'center',padding:11},locationTitle:{fontSize:11,color:colors.navy,fontWeight:'900'},locationSub:{fontSize:8,color:colors.muted,marginTop:2,lineHeight:12}});
