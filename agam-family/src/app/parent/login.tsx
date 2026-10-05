import React, { useState } from 'react';
import { router } from 'expo-router';
import { BackButton, ErrorBox, Field, Kicker, Logo, PrimaryButton, Screen, SecondaryButton, Subtitle, Title } from '../../components/BrandShell';
import { apiConfigured, loginParent } from '../../lib/api';
import { saveSession } from '../../lib/session';
import { registerForPush } from '../../lib/notifications';
import { useLocale } from '../../lib/locale';

export default function ParentLoginScreen() {
  const {t}=useLocale(); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  async function submit() {
    setError(''); if (!email.includes('@') || !password) return setError(`${t('email')} / ${t('password')}`); setBusy(true);
    try {
      if (!apiConfigured()) { await saveSession('preview-parent',{kind:'parent',displayName:'Preview Parent',familyName:'AGAM Preview Family'}); router.replace('/demo'); return; }
      const result:any=await loginParent(email.trim(),password);
      await saveSession(result.token,{kind:'parent',displayName:result.user?.displayName,familyName:result.family?.name,familyId:result.family?.id,memberId:result.member?.id});
      registerForPush().catch(()=>{}); router.replace('/demo');
    } catch(e:any){ setError(e?.code==='INVALID_CREDENTIALS'?'Email or password is incorrect.':'Could not sign in right now.'); }
    finally{setBusy(false)}
  }
  return <Screen>
    <BackButton onPress={()=>router.back()}/><Logo compact/><Kicker>{t('welcomeBack')}</Kicker><Title>{t('signinTitle')}</Title><Subtitle>{t('signinSub')}</Subtitle>
    <Field label={t('email')} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address"/>
    <Field label={t('password')} value={password} onChangeText={setPassword} placeholder={t('password')} secureTextEntry/>
    <ErrorBox text={error}/><PrimaryButton label={busy?'…':t('signIn')} icon="log-in" onPress={submit} disabled={busy}/>
    <SecondaryButton label={t('createNewFamily')} icon="people" onPress={()=>router.replace('/parent/register')}/>
  </Screen>;
}
