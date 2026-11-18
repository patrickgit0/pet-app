import { useCallback, useState } from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { HOME_LABEL, REQUEST_STATUS_LABEL, type RequestStatus } from '@adotai/shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { LoginGate } from '@/lib/login-gate';
import { Button, C, s } from '@/lib/ui';

type Req = { id: string; status: RequestStatus; animals: { name: string } | null; ngos: { name: string } | null };

export default function Profile() {
  const { session, profile } = useAuth();
  const [complete, setComplete] = useState<boolean | null>(null);
  const [requests, setRequests] = useState<Req[]>([]);

  useFocusEffect(useCallback(() => {
    if (!session) return;
    supabase.rpc('is_profile_complete').then(({ data }) => setComplete(Boolean(data)));
    supabase.from('adoption_requests').select('id, status, animals(name), ngos(name)').eq('adopter_id', session.user.id)
      .order('created_at', { ascending: false }).then(({ data }) => setRequests((data as Req[]) ?? []));
  }, [session]));

  if (!session) return <LoginGate message="Entre para ver seu perfil" />;

  function confirmDelete() {
    Alert.alert('Excluir conta', 'Seus dados pessoais serão apagados. Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { await supabase.rpc('delete_my_account'); await supabase.auth.signOut(); } },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View style={[s.card, { padding: 18, gap: 4 }]}>
        <Text style={s.h2}>{profile?.full_name}</Text>
        <Text style={s.muted}>{session.user.email}</Text>
        {profile?.neighborhood ? <Text style={s.muted}>{profile.neighborhood}, {profile.city}</Text> : null}
        {profile?.home_type ? <Text style={s.muted}>Moradia: {HOME_LABEL[profile.home_type]}</Text> : null}
      </View>

      {complete !== null && (
        <View style={{ backgroundColor: complete ? C.brandSoft : C.accentSoft, padding: 14, borderRadius: 12 }}>
          <Text style={{ color: complete ? C.brandDark : C.accentInk, fontWeight: '600' }}>
            {complete ? 'Perfil completo: você já pode pedir adoções.' : 'Para pedir uma adoção, complete seu perfil com CPF, celular e endereço.'}
          </Text>
        </View>
      )}
      <Button title={complete ? 'Editar dados de adoção' : 'Completar perfil'} onPress={() => router.push('/completar-perfil')} />

      <Text style={s.h2}>Meus pedidos</Text>
      {requests.map((r) => (
        <View key={r.id} style={[s.card, { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View>
            <Text style={{ fontWeight: '700', color: C.ink }}>{r.animals?.name}</Text>
            <Text style={s.muted}>{r.ngos?.name}</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.accentInk, backgroundColor: C.accentSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' }}>
            {REQUEST_STATUS_LABEL[r.status]}
          </Text>
        </View>
      ))}
      {!requests.length && <Text style={s.muted}>Você ainda não fez nenhum pedido.</Text>}

      <View style={{ gap: 10, marginTop: 12 }}>
        <Button title="Política de privacidade" variant="ghost" onPress={() => Linking.openURL('https://github.com/Gustavo-Patrocinio/pet-app')} />
        <Button title="Sair" variant="ghost" onPress={() => supabase.auth.signOut()} />
        <Text accessibilityRole="button" onPress={confirmDelete} style={{ textAlign: 'center', color: C.danger, fontWeight: '700', padding: 12 }}>Excluir minha conta</Text>
      </View>
    </ScrollView>
  );
}
