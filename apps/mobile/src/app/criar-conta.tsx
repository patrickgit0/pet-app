import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button, Field, s } from '@/lib/ui';

/** Etapa 1 do cadastro: só nome completo, e-mail e senha. */
export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (name.trim().split(/\s+/).length < 2) return setError('Informe seu nome completo.');
    if (password.length < 8) return setError('A senha precisa ter pelo menos 8 caracteres.');
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } });
    setBusy(false);
    if (error) return setError(error.message.includes('registered') ? 'Este e-mail já tem conta.' : 'Não foi possível criar a conta.');
    if (!data.session) return setInfo('Conta criada! Confira seu e-mail para confirmar o cadastro.');
    router.back();
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled">
      <Text style={s.muted}>Encontre seu novo melhor amigo. Leva menos de um minuto.</Text>
      <Field label="Nome completo" value={name} onChangeText={setName} autoComplete="name" />
      <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field label="Senha" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" hint="Mínimo de 8 caracteres" />
      {error && <Text style={s.error}>{error}</Text>}
      {info && <Text style={[s.body, { fontWeight: '600' }]}>{info}</Text>}
      <Button title="Criar conta" onPress={submit} loading={busy} />
    </ScrollView>
  );
}
