import React, { useState } from 'react';
import { router } from 'expo-router';
import { BackButton, ErrorBox, Field, Kicker, Logo, PrimaryButton, Screen, Subtitle, Title } from '../../components/BrandShell';
import { apiConfigured, registerParent } from '../../lib/api';
import { saveSession } from '../../lib/session';
import { registerForPush } from '../../lib/notifications';
import { useLocale } from '../../lib/locale';

export default function ParentRegisterScreen() {
  const {t}=useLocale();
  const [name, setName] = useState(''); const [familyName, setFamilyName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (name.trim().length < 2) return setError(t('yourName'));
    if (!email.includes('@')) return setError('Enter a valid email address.');
    if (password.length < 10) return setError(t('passwordMin'));
    setBusy(true);
    try {
      if (!apiConfigured()) {
        await saveSession('preview-parent', { kind: 'parent', displayName: name.trim(), familyName: familyName.trim() || `${name.trim()}'s Family` });
        router.replace('/parent/pair'); return;
      }
      const result: any = await registerParent({ email: email.trim(), password, displayName: name.trim(), familyName: familyName.trim() || undefined, locale: 'en' });
      await saveSession(result.token, { kind: 'parent', displayName: result.user?.displayName, familyName: result.family?.name, familyId: result.family?.id, memberId: result.member?.id });
      registerForPush().catch(() => {}); router.replace('/parent/pair');
    } catch (e: any) {
      if(e?.code==='EMAIL_CONFIRMATION_REQUIRED') setError('Check your email to confirm the account, then sign in.');
      else if(e?.code==='EMAIL_IN_USE') setError('That email is already registered.');
      else setError('Could not create the family right now.');
    } finally { setBusy(false); }
  }

  return <Screen>
    <BackButton onPress={() => router.back()} /><Logo compact /><Kicker>{t('parentAccount')}</Kicker><Title>{t('createCircle')}</Title><Subtitle>{t('createCircleSub')}</Subtitle>
    <Field label={t('yourName')} value={name} onChangeText={setName} placeholder="Alex" autoCapitalize="words" />
    <Field label={t('familyName')} value={familyName} onChangeText={setFamilyName} placeholder="The Dayan Family" autoCapitalize="words" />
    <Field label={t('email')} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
    <Field label={t('password')} value={password} onChangeText={setPassword} placeholder={t('passwordMin')} secureTextEntry />
    <ErrorBox text={error} /><PrimaryButton label={busy ? '…' : t('createFamily')} icon="shield-checkmark" onPress={submit} disabled={busy} />
    {!apiConfigured() ? <Subtitle>Preview mode: account data stays on this device until the secure cloud is connected.</Subtitle> : null}
  </Screen>;
}
