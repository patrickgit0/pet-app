import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SIZE_LABEL, sexLabel, type AnimalSex, type AnimalSize } from '@adotai/shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { LoginGate } from '@/lib/login-gate';
import { C, s, tintFor } from '@/lib/ui';

type Fav = { id: string; name: string; sex: AnimalSex; size: AnimalSize; ngos: { name: string } | null };

export default function Favorites() {
  const { session } = useAuth();
  const [items, setItems] = useState<Fav[]>([]);

  useFocusEffect(useCallback(() => {
    if (!session) return;
    supabase.from('favorites').select('animals(id, name, sex, size, ngos(name))').order('created_at', { ascending: false })
      .then(({ data }) => setItems((data ?? []).map((f) => f.animals).filter(Boolean) as Fav[]));
  }, [session]));

  if (!session) return <LoginGate message="Entre para ver seus favoritos" />;
  return (
    <FlatList
      data={items}
      keyExtractor={(a) => a.id}
      contentContainerStyle={{ padding: 20, gap: 12 }}
      ListEmptyComponent={<Text style={[s.muted, { textAlign: 'center', marginTop: 40 }]}>Toque no coração de um animal para salvá-lo aqui.</Text>}
      renderItem={({ item: a }) => (
        <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/animal/[id]', params: { id: a.id } })} style={[s.card, { flexDirection: 'row', gap: 12, padding: 10, alignItems: 'center' }]}>
            <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: tintFor(a.name) }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: C.ink }}>{a.name}</Text>
              <Text style={s.muted}>{sexLabel(a.sex)} · Porte {SIZE_LABEL[a.size].toLowerCase()} · {a.ngos?.name}</Text>
            </View>
          </Pressable>
      )}
    />
  );
}
