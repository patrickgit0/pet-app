import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { REQUEST_STATUS_LABEL, type Database, type RequestStatus } from '@adotai/shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { C, s, tintFor } from '@/lib/ui';

type Msg = Database['public']['Tables']['messages']['Row'];

export default function ChatScreen() {
  const { id, pedido } = useLocalSearchParams<{ id: string; pedido?: string }>();
  const { session } = useAuth();
  const me = session?.user.id;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [title, setTitle] = useState('Conversa');
  const [animal, setAnimal] = useState<string>('');
  const [status, setStatus] = useState<RequestStatus | null>(null);
  const listRef = useRef<FlatList<Msg>>(null);

  useEffect(() => {
    (async () => {
      const { data: conv } = await supabase.from('conversations').select('animal_id, adopter_id, animals(name), ngos(name)').eq('id', id).single();
      if (conv) {
        setTitle(conv.ngos?.name ?? 'ONG');
        setAnimal(conv.animals?.name ?? '');
        const { data: req } = await supabase.from('adoption_requests').select('status')
          .eq('animal_id', conv.animal_id).eq('adopter_id', conv.adopter_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        setStatus(req?.status ?? null);
      }
      const { data } = await supabase.from('messages').select('*').eq('conversation_id', id).order('created_at');
      setMsgs(data ?? []);
      if (me) await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('conversation_id', id).neq('sender_id', me).is('read_at', null);
    })();

    const ch = supabase.channel(`conv:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        (p) => setMsgs((cur) => (cur.some((m) => m.id === (p.new as Msg).id) ? cur : [...cur, p.new as Msg])))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        (p) => setMsgs((cur) => cur.map((m) => (m.id === (p.new as Msg).id ? (p.new as Msg) : m))))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, me]);

  async function send() {
    const body = draft.trim();
    if (!body || !me) return;
    setDraft('');
    const { data } = await supabase.from('messages').insert({ conversation_id: id, sender_id: me, body }).select().single();
    if (data) setMsgs((cur) => (cur.some((m) => m.id === data.id) ? cur : [...cur, data]));
  }

  async function confirmVisit(m: Msg) {
    const at = new Date().toISOString();
    await supabase.from('messages').update({ visit_confirmed_at: at }).eq('id', m.id);
    setMsgs((cur) => cur.map((x) => (x.id === m.id ? { ...x, visit_confirmed_at: at } : x)));
  }

  return (
    <SafeAreaView edges={['bottom']} style={s.screen}>
      <Stack.Screen options={{ title }} />
      <View style={[s.card, st.animal]}>
        <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: tintFor(animal) }} />
        <Text style={{ flex: 1, fontWeight: '700', color: C.ink }}>{animal}{status ? ' · Pedido de adoção' : ''}</Text>
        {status && <Text style={st.status}>{REQUEST_STATUS_LABEL[status]}</Text>}
      </View>
      {pedido === 'enviado' && <Text style={st.notice}>Pedido enviado! A ONG vai analisar seu perfil e responder por aqui.</Text>}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(m) => m.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item: m }) => {
            const mine = m.sender_id === me;
            if (m.kind === 'system') return <Text style={st.system}>{m.body}</Text>;
            if (m.kind === 'visit_proposal') {
              return (
                <View style={[st.visit, { alignSelf: mine ? 'flex-end' : 'flex-start' }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: C.brand }}>Proposta de visita</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: C.ink }}>
                    {m.visit_at ? new Date(m.visit_at).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                  </Text>
                  {m.visit_place ? <Text style={s.muted}>{m.visit_place}</Text> : null}
                  {m.visit_confirmed_at ? (
                    <Text style={st.confirmed}>✓ Visita confirmada</Text>
                  ) : !mine ? (
                    <Pressable accessibilityRole="button" onPress={() => confirmVisit(m)} style={st.confirmBtn}>
                      <Text style={{ color: C.white, fontWeight: '700' }}>Confirmar visita</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            }
            return (
              <View style={{ maxWidth: '78%', alignSelf: mine ? 'flex-end' : 'flex-start', gap: 3 }}>
                <Text style={[st.bubble, mine ? st.mine : st.theirs]}>{m.body}</Text>
                <Text style={{ fontSize: 10, color: C.muted, textAlign: mine ? 'right' : 'left' }}>
                  {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{mine ? (m.read_at ? ' · lida' : ' · enviada') : ''}
                </Text>
              </View>
            );
          }}
        />
        <View style={st.composer}>
          <TextInput value={draft} onChangeText={setDraft} placeholder="Escreva uma mensagem" placeholderTextColor={C.muted}
            accessibilityLabel="Mensagem" style={st.input} multiline maxLength={4000} />
          <Pressable accessibilityRole="button" accessibilityLabel="Enviar" onPress={send} style={st.send}>
            <Text style={{ color: C.white, fontSize: 18, fontWeight: '800' }}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  animal: { margin: 16, marginBottom: 0, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  status: { fontSize: 11, fontWeight: '700', backgroundColor: C.accentSoft, color: C.accentInk, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  notice: { marginHorizontal: 16, marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: C.brandSoft, color: C.brandDark, fontWeight: '600', overflow: 'hidden' },
  system: { alignSelf: 'center', fontSize: 11, color: C.muted, backgroundColor: C.line, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  bubble: { paddingHorizontal: 13, paddingVertical: 10, fontSize: 14, lineHeight: 20, overflow: 'hidden' },
  mine: { backgroundColor: C.brand, color: C.white, borderRadius: 16, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: C.white, color: C.ink, borderRadius: 16, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.line },
  visit: { width: '78%', backgroundColor: C.white, borderRadius: 16, borderWidth: 1.5, borderColor: C.brand, padding: 12, gap: 6 },
  confirmed: { textAlign: 'center', backgroundColor: C.brandSoft, color: C.brandDark, fontWeight: '700', paddingVertical: 8, borderRadius: 10, overflow: 'hidden' },
  confirmBtn: { height: 40, borderRadius: 10, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line },
  input: { flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, backgroundColor: C.field, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 14, color: C.ink },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
});
