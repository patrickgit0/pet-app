import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {
  PILOT_CITY, RADIUS_OPTIONS_KM, SIZE_LABEL, SORT_OPTIONS, formatAge, formatDistance, formatRating, sexLabel,
  type AnimalSize, type SortOption, type Species,
} from '@adotai/shared';
import { photoUrl, supabase } from '@/lib/supabase';
import { C, Chip, s, tintFor } from '@/lib/ui';

type Row = {
  id: string; name: string; sex: 'male' | 'female'; size: AnimalSize; age_months: number | null;
  distance_km: number; cover_path: string | null; ngo_name: string; ngo_verified: boolean; ngo_rating: number | null;
  neutered: boolean | null; vaccinated: boolean | null; good_with_kids: boolean | null; total_count: number;
};

export default function SearchScreen() {
  const [center, setCenter] = useState<{ lat: number; lng: number; label: string }>({ lat: PILOT_CITY.lat, lng: PILOT_CITY.lng, label: `${PILOT_CITY.name}, ${PILOT_CITY.state}` });
  const [radius, setRadius] = useState<number>(10);
  const [species, setSpecies] = useState<Species | null>(null);
  const [size, setSize] = useState<AnimalSize | null>(null);
  const [neutered, setNeutered] = useState(false);
  const [sort, setSort] = useState<SortOption>('recommended');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState(''); // texto aplicado (ao enviar a busca)
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    supabase.rpc('search_animals', {
      p_lat: center.lat, p_lng: center.lng, p_radius_km: radius,
      p_species: species ? [species] : undefined, p_sizes: size ? [size] : undefined,
      p_neutered: neutered ? true : undefined, p_query: query.trim() || undefined, p_sort: sort, p_limit: 50,
    }).then(({ data, error }) => {
      if (!alive) return;
      setError(error ? 'Não foi possível carregar. Verifique sua conexão.' : null);
      setRows((data as unknown as Row[]) ?? []);
      setLoading(false);
      setRefreshing(false);
    });
    return () => { alive = false; };
  }, [center, radius, species, size, neutered, sort, query, reload]);

  const refresh = useCallback(() => { setRefreshing(true); setReload((r) => r + 1); }, []);

  async function useMyLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Sua localização' });
  }

  const nextRadius = () => setRadius(RADIUS_OPTIONS_KM[(RADIUS_OPTIONS_KM.indexOf(radius as never) + 1) % RADIUS_OPTIONS_KM.length]);
  const nextSort = () => setSort(SORT_OPTIONS[(SORT_OPTIONS.findIndex((o) => o.value === sort) + 1) % SORT_OPTIONS.length].value);
  const total = rows[0]?.total_count ?? 0;

  return (
    <SafeAreaView edges={['top']} style={s.screen}>
      <View style={st.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pressable accessibilityRole="button" onPress={useMyLocation} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={s.muted}>Buscando perto de</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink }}>{center.label} · {radius} km</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Mudar distância" onPress={nextRadius} style={st.radiusBtn}>
            <Text style={{ fontWeight: '700', color: C.brandDark }}>{radius} km</Text>
          </Pressable>
        </View>
        <TextInput value={q} onChangeText={setQ} onSubmitEditing={() => setQuery(q)} returnKeyType="search" placeholder="Buscar por raça, nome ou ONG"
          placeholderTextColor={C.muted} accessibilityLabel="Buscar" style={st.search} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label="Cães" active={species === 'dog'} onPress={() => setSpecies(species === 'dog' ? null : 'dog')} />
          <Chip label="Gatos" active={species === 'cat'} onPress={() => setSpecies(species === 'cat' ? null : 'cat')} />
          <Chip label="Outros" active={species === 'other'} onPress={() => setSpecies(species === 'other' ? null : 'other')} />
          {(Object.keys(SIZE_LABEL) as AnimalSize[]).map((sz) => (
            <Chip key={sz} label={`Porte ${SIZE_LABEL[sz].toLowerCase()}`} active={size === sz} onPress={() => setSize(size === sz ? null : sz)} />
          ))}
          <Chip label="Castrado" active={neutered} onPress={() => setNeutered(!neutered)} />
        </ScrollView>
      </View>

      <View style={st.bar}>
        <Text style={s.muted}><Text style={{ fontWeight: '800', color: C.ink }}>{total} animais</Text> perto de você</Text>
        <Pressable accessibilityRole="button" onPress={nextSort} style={{ minHeight: 32, justifyContent: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.ink }}>{SORT_OPTIONS.find((o) => o.value === sort)?.label} ▾</Text>
        </Pressable>
      </View>

      {error && <Text style={[s.error, { paddingHorizontal: 20 }]}>{error}</Text>}
      {loading && !rows.length ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={C.brand} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={C.brand} />}
          ListEmptyComponent={<Text style={[s.muted, { textAlign: 'center', marginTop: 40 }]}>Nenhum animal com esses filtros. Tente aumentar a distância.</Text>}
          renderItem={({ item: a }) => (
            <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/animal/[id]', params: { id: a.id } })} style={[s.card, st.row]}>
                <View style={[st.photo, { backgroundColor: tintFor(a.name) }]}>
                  {a.cover_path ? <Image source={{ uri: photoUrl(a.cover_path)! }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: C.ink }}>{a.name}</Text>
                  <Text style={s.muted}>{sexLabel(a.sex)} · {formatAge(a.age_months)} · Porte {SIZE_LABEL[a.size].toLowerCase()}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {a.neutered && <Text style={s.tag}>Castrado</Text>}
                    {a.vaccinated && <Text style={s.tag}>Vacinado</Text>}
                    {a.good_with_kids && <Text style={s.tag}>Ok com crianças</Text>}
                  </View>
                  <View style={{ marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, fontWeight: '600', color: C.ink }}>
                      {a.ngo_verified ? '✓ ' : ''}{a.ngo_name} · {formatRating(a.ngo_rating) ? `★ ${formatRating(a.ngo_rating)}` : 'Nova'}
                    </Text>
                    <Text style={{ fontSize: 12, color: C.muted }}>{formatDistance(Number(a.distance_km))}</Text>
                  </View>
                </View>
              </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  header: { backgroundColor: C.white, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  radiusBtn: { minWidth: 44, height: 44, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.brandSoft, alignItems: 'center', justifyContent: 'center' },
  search: { height: 46, borderRadius: 12, backgroundColor: C.field, paddingHorizontal: 14, fontSize: 14, color: C.ink },
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
  row: { flexDirection: 'row', gap: 12, padding: 10 },
  photo: { width: 104, height: 104, borderRadius: 12, overflow: 'hidden' },
});
