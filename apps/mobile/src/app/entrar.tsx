import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button, Field, s } from '@/lib/ui';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setError('E-mail ou senha incorretos.');
    router.back();
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled">
      <Text style={s.muted}>Bom te ver de novo.</Text>
      <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
      {error && <Text style={s.error}>{error}</Text>}
      <Button title="Entrar" onPress={submit} loading={busy} />
      <Button title="Criar conta" variant="ghost" onPress={() => router.replace('/criar-conta')} />
    </ScrollView>
  );
}
