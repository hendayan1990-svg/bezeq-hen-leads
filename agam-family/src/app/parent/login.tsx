import React, { useState } from 'react';
import { router } from 'expo-router';
import { BackButton, ErrorBox, Field, Kicker, Logo, PrimaryButton, Screen, SecondaryButton, Subtitle, Title } from '../../components/BrandShell';
import { apiConfigured, loginParent } from '../../lib/api';
import { saveSession } from '../../lib/session';
import { registerForPush } from '../../lib/notifications';

export default function ParentLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    if (!email.includes('@') || !password) return setError('Enter your email and password.');
    setBusy(true);
    try {
      if (!apiConfigured()) {
        await saveSession('preview-parent', { kind: 'parent', displayName: 'Preview Parent', familyName: 'AGAM Preview Family' });
        router.replace('/demo');
        return;
      }
      const result: any = await loginParent(email.trim(), password);
      await saveSession(result.token, { kind: 'parent', displayName: result.user?.displayName, familyName: result.family?.name, familyId: result.family?.id, memberId: result.member?.id });
      registerForPush().catch(() => {});
      router.replace('/demo');
    } catch (e: any) {
      setError(e?.code === 'INVALID_CREDENTIALS' ? 'Email or password is incorrect.' : 'Could not sign in right now.');
    } finally { setBusy(false); }
  }

  return <Screen>
    <BackButton onPress={() => router.back()} />
    <Logo compact />
    <Kicker>Welcome back</Kicker>
    <Title>Sign in to your family</Title>
    <Subtitle>Your family circle stays private and encrypted in transit.</Subtitle>
    <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
    <Field label="Password" value={password} onChangeText={setPassword} placeholder="Your password" secureTextEntry />
    <ErrorBox text={error} />
    <PrimaryButton label={busy ? 'Signing in…' : 'Sign in'} icon="log-in" onPress={submit} disabled={busy} />
    <SecondaryButton label="Create a new family" icon="people" onPress={() => router.replace('/parent/register')} />
  </Screen>;
}
