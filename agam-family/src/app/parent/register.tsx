import React, { useState } from 'react';
import { router } from 'expo-router';
import { BackButton, ErrorBox, Field, Kicker, Logo, PrimaryButton, Screen, Subtitle, Title } from '../../components/BrandShell';
import { apiConfigured, registerParent } from '../../lib/api';
import { saveSession } from '../../lib/session';
import { registerForPush } from '../../lib/notifications';

export default function ParentRegisterScreen() {
  const [name, setName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (name.trim().length < 2) return setError('Enter your name.');
    if (!email.includes('@')) return setError('Enter a valid email address.');
    if (password.length < 10) return setError('Use at least 10 characters for your password.');
    setBusy(true);
    try {
      if (!apiConfigured()) {
        await saveSession('preview-parent', { kind: 'parent', displayName: name.trim(), familyName: familyName.trim() || `${name.trim()}'s Family` });
        router.replace('/parent/pair');
        return;
      }
      const result: any = await registerParent({
        email: email.trim(), password, displayName: name.trim(),
        familyName: familyName.trim() || undefined, locale: 'en',
      });
      await saveSession(result.token, { kind: 'parent', displayName: result.user?.displayName, familyName: result.family?.name, familyId: result.family?.id, memberId: result.member?.id });
      registerForPush().catch(() => {});
      router.replace('/parent/pair');
    } catch (e: any) {
      setError(e?.code === 'EMAIL_IN_USE' ? 'That email is already registered.' : 'Could not create the family right now.');
    } finally { setBusy(false); }
  }

  return <Screen>
    <BackButton onPress={() => router.back()} />
    <Logo compact />
    <Kicker>Parent account</Kicker>
    <Title>Create your family circle</Title>
    <Subtitle>Your family is private by default. Only people you invite can join.</Subtitle>
    <Field label="Your name" value={name} onChangeText={setName} placeholder="Alex" autoCapitalize="words" />
    <Field label="Family name" value={familyName} onChangeText={setFamilyName} placeholder="The Dayan Family" autoCapitalize="words" />
    <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
    <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 10 characters" secureTextEntry />
    <ErrorBox text={error} />
    <PrimaryButton label={busy ? 'Creating…' : 'Create family'} icon="shield-checkmark" onPress={submit} disabled={busy} />
    {!apiConfigured() ? <Subtitle>Preview mode: account data stays on this device until the cloud project is connected.</Subtitle> : null}
  </Screen>;
}
