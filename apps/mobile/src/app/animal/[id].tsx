import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ENERGY_LABEL, SIZE_LABEL, formatAge, formatRating, rpcErrorMessage, sexLabel, type Database } from '@adotai/shared';
import { photoUrl, supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Button, C, s, tintFor } from '@/lib/ui';

type Animal = Database['public']['Tables']['animals']['Row'] & {
  ngos: { name: string; verified_at: string | null; rating: number | null; completed_adoptions: number; median_response_minutes: number | null } | null;
  animal_photos: { storage_path: string; position: number }[];
};

export default function AnimalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuth();
  const [a, setA] = useState<Animal | null>(null);
  const [fav, setFav] = useState(false);
  const [busy, setBusy] = useState(false);
  const [months, setMonths] = useState<number | null>(null);

  useEffect(() => {
    supabase.from('animals')
      .select('*, ngos(name, verified_at, rating, completed_adoptions, median_response_minutes), animal_photos(storage_path, position)')
      .eq('id', id).maybeSingle()
      .then(({ data }) => {
        setA(data as Animal | null);
        const b = data?.birth_date_estimate;
        setMonths(b ? Math.round((Date.now() - new Date(b).getTime()) / 2.63e9) : null);
      });
    if (session) supabase.from('favorites').select('animal_id').eq('animal_id', id).maybeSingle().then(({ data }) => setFav(Boolean(data)));
  }, [id, session]);

  function requireLogin(): boolean {
    if (session) return true;
    router.push('/entrar');
    return false;
  }

  async function toggleFav() {
    if (!requireLogin()) return;
    if (fav) await supabase.from('favorites').delete().eq('animal_id', id).eq('user_id', session!.user.id);
    else await supabase.from('favorites').insert({ animal_id: id, user_id: session!.user.id });
    setFav(!fav);
  }

  async function chat() {
    if (!requireLogin()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('start_conversation', { p_animal_id: id });
    setBusy(false);
    if (error) return Alert.alert('Ops', rpcErrorMessage(error.message));
    router.push({ pathname: '/chat/[id]', params: { id: data as string } });
  }

  // "Quero adotar": exige perfil completo (CPF, celular, endereço). Se faltar, abre a tela e volta para o pedido.
  async function adopt() {
    if (!requireLogin()) return;
    setBusy(true);
    const { data: complete } = await supabase.rpc('is_profile_complete');
    if (!complete) {
      setBusy(false);
      return router.push({ pathname: '/completar-perfil', params: { animal: id, name: a?.name } });
    }
    const { error } = await supabase.rpc('request_adoption', { p_animal_id: id });
    if (error) { setBusy(false); return Alert.alert('Ops', rpcErrorMessage(error.message)); }
    const { data: conv } = await supabase.rpc('start_conversation', { p_animal_id: id });
    setBusy(false);
    router.push({ pathname: '/chat/[id]', params: { id: conv as string, pedido: 'enviado' } });
  }

  if (!a) return <ActivityIndicator style={{ marginTop: 60 }} color={C.brand} />;
  const photos = [...a.animal_photos].sort((x, y) => x.position - y.position);
  const isNgo = profile?.role === 'ngo_member';
  const compat = [
    [a.good_with_kids, 'Crianças'], [a.good_with_dogs, 'Outros cães'], [a.good_with_cats, 'Gatos'], [a.good_for_apartment, 'Apartamento'],
  ].filter(([v]) => v !== null) as [boolean, string][];

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: C.white }}>
      <Stack.Screen options={{ title: a.name, headerRight: () => (
        <Text accessibilityRole="button" accessibilityLabel={fav ? 'Remover dos favoritos' : 'Favoritar'} onPress={toggleFav}
          style={{ fontSize: 22, color: fav ? C.accent : C.ink, paddingHorizontal: 8 }}>{fav ? '♥' : '♡'}</Text>
      ) }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[st.hero, { backgroundColor: tintFor(a.name) }]}>
          {photos[0] && <Image source={{ uri: photoUrl(photos[0].storage_path)! }} style={StyleSheet.absoluteFill} contentFit="cover" />}
          {photos.length > 1 && <Text style={st.count}>{photos.length} fotos</Text>}
        </View>
        <View style={{ padding: 20, gap: 18 }}>
          <View style={{ gap: 4 }}>
            <Text style={s.h1}>{a.name}</Text>
            <Text style={s.muted}>{sexLabel(a.sex)} · {formatAge(months)} · Porte {SIZE_LABEL[a.size].toLowerCase()} · {a.breed}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Fact k="Saúde" v={a.neutered ? 'Castrado' : a.neutered === false ? 'Não castrado' : '—'} />
            <Fact k="Vacinas" v={a.vaccinated ? 'Em dia' : a.vaccinated === false ? 'Pendentes' : '—'} />
            <Fact k="Energia" v={a.energy ? ENERGY_LABEL[a.energy] : '—'} />
          </View>
          {compat.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={s.h2}>Convive bem com</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {compat.map(([ok, l]) => (
                  <Text key={l} style={[st.compat, !ok && { color: C.muted }]}>{ok ? '✓' : '✕'} {l}</Text>
                ))}
              </View>
            </View>
          )}
          {a.special_needs && <Text style={[s.body, st.special]}>Cuidados especiais: {a.special_needs}</Text>}
          {a.description && <Text style={s.body}>{a.description}</Text>}
          {a.ngos && (
            <View style={st.ngo}>
              <Text style={{ fontWeight: '700', color: C.ink }}>{a.ngos.name}{a.ngos.verified_at ? ' ✓' : ''}</Text>
              <Text style={s.muted}>
                {formatRating(a.ngos.rating) ? `★ ${formatRating(a.ngos.rating)}` : 'Nova na plataforma'} · {a.ngos.completed_adoptions} adoções
                {a.ngos.median_response_minutes != null ? ` · responde em ~${a.ngos.median_response_minutes} min` : ''}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      {!isNgo && a.status === 'available' && (
        <View style={st.footer}>
          <Button title="Conversar" variant="outline" onPress={chat} disabled={busy} />
          <Button title="Quero adotar" onPress={adopt} loading={busy} style={{ flex: 1 }} />
        </View>
      )}
    </SafeAreaView>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.brandSoft, borderRadius: 12, padding: 10, gap: 2 }}>
      <Text style={{ fontSize: 11, color: C.brandDark }}>{k}</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color: C.ink }}>{v}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  hero: { height: 300, overflow: 'hidden' },
  count: { position: 'absolute', right: 14, bottom: 14, backgroundColor: 'rgba(27,31,29,0.75)', color: C.white, fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: 'hidden' },
  compat: { fontSize: 13, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: C.line2, color: C.ink },
  special: { backgroundColor: C.accentSoft, color: C.accentInk, padding: 12, borderRadius: 12, overflow: 'hidden' },
  ngo: { backgroundColor: C.ground, borderRadius: 14, padding: 12, gap: 2 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.line },
});
