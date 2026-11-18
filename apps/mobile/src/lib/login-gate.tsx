import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, s } from './ui';

/** Tela mostrada nas abas que exigem conta. */
export function LoginGate({ message }: { message: string }) {
  return (
    <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 14 }}>
      <Text style={[s.h2, { textAlign: 'center' }]}>{message}</Text>
      <Text style={[s.muted, { textAlign: 'center' }]}>Criar conta é rápido: só nome, e-mail e senha.</Text>
      <Button title="Criar conta" onPress={() => router.push('/criar-conta')} />
      <Button title="Já tenho conta" variant="ghost" onPress={() => router.push('/entrar')} />
    </View>
  );
}
