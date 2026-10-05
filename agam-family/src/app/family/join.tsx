import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BackButton, ErrorBox, FeatureRow, Field, Kicker, Logo, PrimaryButton, Screen, Subtitle, Title } from '../../components/BrandShell';
import { apiConfigured, joinFamily } from '../../lib/api';
import { getDeviceName, getOrCreateDeviceUid, getPlatformName } from '../../lib/device';
import { saveSession } from '../../lib/session';
import { registerForPush } from '../../lib/notifications';
import { colors } from '../../lib/theme';
import { useLocale } from '../../lib/locale';

export default function JoinFamilyScreen() {
  const {t}=useLocale(); const params=useLocalSearchParams<{code?:string|string[]}>(); const incoming=Array.isArray(params.code)?params.code[0]:params.code;
  const [code,setCode]=useState(incoming||''); const [name,setName]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  useEffect(()=>{if(incoming)setCode(incoming.replace(/\D/g,'').slice(0,6))},[incoming]);

  async function submit(){
    setError(''); const cleanCode=code.replace(/\D/g,''); if(cleanCode.length!==6)return setError(t('inviteCode')); if(!name.trim())return setError(t('memberName')); setBusy(true);
    try{
      const deviceUid=await getOrCreateDeviceUid();
      if(!apiConfigured()){ if(cleanCode!=='428731')return setError('Preview mode uses code 428731.'); await saveSession('preview-child',{kind:'child',displayName:name.trim(),familyName:'AGAM Preview Family'}); router.replace('/family/protection'); return; }
      const result:any=await joinFamily({code:cleanCode,displayName:name.trim(),deviceUid,platform:getPlatformName(),deviceName:getDeviceName()});
      await saveSession(result.token,{kind:'child',displayName:result.member?.displayName,familyName:result.family?.name,familyId:result.family?.id,memberId:result.member?.id});
      if(Platform.OS!=='web')registerForPush().catch(()=>{}); router.replace('/family/protection');
    }catch(e:any){ const c=e?.code; setError(c==='PAIRING_CODE_INVALID_OR_EXPIRED'||c==='INVALID_OR_EXPIRED_PAIRING_CODE'?'That invite code is invalid or expired.':c==='ANONYMOUS_SIGNIN_FAILED'?'Family-member sign-in is not enabled on the cloud yet.':'Could not join the family right now.'); }
    finally{setBusy(false)}
  }

  return <Screen>
    <BackButton onPress={()=>router.back()}/><Logo compact/><Kicker>{t('joinSetup')}</Kicker><Title>{t('joinTitle')}</Title><Subtitle>{t('joinSub')}</Subtitle>
    <Field label={t('inviteCode')} value={code} onChangeText={(v:string)=>setCode(v.replace(/\D/g,'').slice(0,6))} placeholder="428731" keyboardType="number-pad"/>
    <Field label={t('memberName')} value={name} onChangeText={setName} placeholder="Noa" autoCapitalize="words"/>
    <ErrorBox text={error}/><PrimaryButton label={busy?'…':t('joinFamily')} icon="people" onPress={submit} disabled={busy}/>
    <FeatureRow icon="location" title={t('locationChoice')} text={t('locationChoiceSub')} color={colors.green}/>
    <FeatureRow icon="mic" title={t('audioVisible')} text={t('audioVisibleSub')} color={colors.cyan}/>
  </Screen>;
}
