import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { LoginGate } from '@/lib/login-gate';
import { C, s, tintFor } from '@/lib/ui';

type Conv = {
  id: string;
  animals: { name: string } | null;
  ngos: { name: string } | null;
  messages: { body: string | null; kind: string; sender_id: string; read_at: string | null }[];
};

export default function Messages() {
  const { session } = useAuth();
  const [items, setItems] = useState<Conv[]>([]);

  useFocusEffect(useCallback(() => {
    if (!session) return;
    supabase.from('conversations')
      .select('id, animals(name), ngos(name), messages(body, kind, sender_id, read_at, created_at)')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('created_at', { referencedTable: 'messages', ascending: false })
      .limit(1, { referencedTable: 'messages' })
      .then(({ data }) => setItems((data as Conv[]) ?? []));
  }, [session]));

  if (!session) return <LoginGate message="Entre para conversar com as ONGs" />;
  return (
    <FlatList
      data={items}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ padding: 16 }}
      ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.line }} />}
      ListEmptyComponent={<Text style={[s.muted, { textAlign: 'center', marginTop: 40 }]}>Nenhuma conversa ainda. Abra um animal e toque em “Conversar”.</Text>}
      renderItem={({ item: c }) => {
        const last = c.messages?.[0];
        const unread = last && last.sender_id !== session.user.id && !last.read_at;
        const name = c.ngos?.name ?? 'ONG';
        return (
          <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/chat/[id]', params: { id: c.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: tintFor(name), alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontWeight: '800', color: C.ink }}>{name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: unread ? '800' : '700', color: C.ink }}>{name} · {c.animals?.name}</Text>
                <Text numberOfLines={1} style={s.muted}>{last?.kind === 'visit_proposal' ? 'Proposta de visita' : last?.body ?? 'Conversa iniciada'}</Text>
              </View>
              {unread && <View accessibilityLabel="Não lida" style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.accent }} />}
            </Pressable>
        );
      }}
    />
  );
}
