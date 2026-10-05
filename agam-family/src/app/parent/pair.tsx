import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Card, Kicker, Logo, PrimaryButton, Screen, SecondaryButton, Subtitle, Title } from '../../components/BrandShell';
import { apiConfigured, createPairingCode } from '../../lib/api';
import { colors } from '../../lib/theme';
import { useLocale } from '../../lib/locale';

const PREVIEW_CODE='428731';
export default function PairScreen(){
  const {t,isRTL}=useLocale(); const [code,setCode]=useState(''); const [expiresAt,setExpiresAt]=useState<string|null>(null); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  async function generate(){setBusy(true);setError('');try{if(!apiConfigured()){setCode(PREVIEW_CODE);setExpiresAt(new Date(Date.now()+10*60_000).toISOString());return;}const result=await createPairingCode();setCode(result.code);setExpiresAt(result.expiresAt)}catch{setError('Could not create an invite code.')}finally{setBusy(false)}}
  useEffect(()=>{generate()},[]); const qr=code?`agamfamily://family/join?code=${code}`:'agamfamily://family/join';
  return <Screen>
    <BackButton onPress={()=>router.back()}/><Logo compact/><Kicker>{t('addMember')}</Kicker><Title>{t('pairTitle')}</Title><Subtitle>{t('pairSub')}</Subtitle>
    <Card style={styles.inviteCard}>
      <View style={styles.qrWrap}><QRCode value={qr} size={178} backgroundColor="white" color="#071421"/></View><Text style={styles.code}>{code||'••••••'}</Text>
      <Text style={styles.caption}>{apiConfigured()?t('privateInvite'):t('previewCode')}</Text>
      {expiresAt?<View style={[styles.expire,isRTL&&{flexDirection:'row-reverse'}]}><Ionicons name="time" size={15} color={colors.muted}/><Text style={styles.expireText}>{t('expiresIn')} {new Date(expiresAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</Text></View>:null}
    </Card>
    {error?<Text style={styles.error}>{error}</Text>:null}
    <PrimaryButton label={busy?'…':t('generateCode')} icon="refresh" onPress={generate} disabled={busy}/>
    <SecondaryButton label={t('openDashboard')} icon="map" onPress={()=>router.replace(apiConfigured()?'/dashboard':'/demo')}/>
    <Pressable onPress={()=>router.push('/family/join')} style={styles.test}><Text style={styles.testText}>{t('testJoin')}</Text></Pressable>
  </Screen>;
}
const styles=StyleSheet.create({inviteCard:{alignItems:'center',paddingVertical:24},qrWrap:{padding:13,borderRadius:20,backgroundColor:'white'},code:{color:'white',fontSize:38,fontWeight:'900',letterSpacing:7,marginTop:8},caption:{color:colors.cyan,fontSize:9,fontWeight:'900',letterSpacing:1.2,textAlign:'center'},expire:{flexDirection:'row',gap:6,alignItems:'center'},expireText:{color:colors.muted,fontSize:11},error:{color:'#FF9AAA',textAlign:'center'},test:{alignItems:'center',padding:8},testText:{color:'#8FBCD8',fontSize:11,textDecorationLine:'underline',textAlign:'center'}});
