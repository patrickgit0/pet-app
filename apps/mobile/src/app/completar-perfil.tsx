import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  HOME_LABEL, formatCep, formatCpf, formatPhone, isValidCpf, lookupCep, rpcErrorMessage, toE164Phone,
  type CepResult, type HomeType,
} from '@adotai/shared';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { Button, C, Field, s } from '@/lib/ui';

/** Etapa 2: CPF, celular (SMS), CEP → cidade/bairro, endereço e complemento, moradia. */
export default function CompleteProfile() {
  const { animal, name } = useLocalSearchParams<{ animal?: string; name?: string }>();
  const { session, profile, refreshProfile } = useAuth();
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [cep, setCep] = useState('');
  const [addr, setAddr] = useState<CepResult | null>(null);
  const [street, setStreet] = useState('');
  const [complement, setComplement] = useState('');
  const [home, setHome] = useState<HomeType | null>(profile?.home_type ?? null);
  const [yard, setYard] = useState(Boolean(profile?.has_yard));
  const [kids, setKids] = useState(Boolean(profile?.has_children));
  const [pets, setPets] = useState(profile?.other_pets ?? '');
  const [consent, setConsent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) return;
    supabase.from('profile_private').select('*').eq('id', session.user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      if (data.cpf) setCpf(formatCpf(data.cpf));
      if (data.phone) setPhone(formatPhone(data.phone.replace(/^\+55/, '')));
      setPhoneVerified(Boolean(data.phone_verified_at));
      if (data.cep) onCep(data.cep);
      if (data.street) setStreet(data.street);
      if (data.complement) setComplement(data.complement);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function onCep(v: string) {
    const f = formatCep(v);
    setCep(f);
    setAddr(null);
    if (f.length === 9) {
      const r = await lookupCep(f);
      setAddr(r);
      if (r?.street && !street) setStreet(`${r.street}, `);
    }
  }

  async function sendCode() {
    const e164 = toE164Phone(phone);
    if (!e164) return setMsg('Celular inválido.');
    const { error } = await supabase.auth.updateUser({ phone: e164 });
    if (error) return setMsg('Não foi possível enviar o SMS agora.');
    setCodeSent(true);
    setMsg('Enviamos um código por SMS.');
  }

  async function verify() {
    const { error } = await supabase.auth.verifyOtp({ phone: toE164Phone(phone)!, token: code.trim(), type: 'phone_change' });
    if (error) return setMsg('Código incorreto ou expirado.');
    await supabase.rpc('sync_phone_verification');
    setPhoneVerified(true);
    setMsg(null);
  }

  async function save() {
    setError(null);
    if (!isValidCpf(cpf)) return setError('CPF inválido.');
    if (!phoneVerified) return setError('Confirme seu celular com o código por SMS.');
    if (!addr) return setError('Informe um CEP válido.');
    if (!street.trim()) return setError('Informe o endereço.');
    if (!home) return setError('Diga onde você mora.');
    if (!consent) return setError('É preciso aceitar a Política de Privacidade.');
    setBusy(true);
    const { error } = await supabase.rpc('complete_profile', {
      p_cpf: cpf, p_phone: toE164Phone(phone)!, p_cep: cep, p_street: street, p_complement: complement,
      p_neighborhood: addr.neighborhood ?? '', p_city: addr.city, p_state: addr.state,
      p_lat: addr.lat ?? undefined, p_lng: addr.lng ?? undefined, p_home_type: home,
      p_has_yard: yard, p_has_children: kids, p_other_pets: pets, p_lgpd_consent: consent,
    } as never);
    if (error) { setBusy(false); return setError(rpcErrorMessage(error.message)); }
    await refreshProfile();
    if (animal) {
      const { error: reqErr } = await supabase.rpc('request_adoption', { p_animal_id: animal });
      if (reqErr) { setBusy(false); return setError(rpcErrorMessage(reqErr.message)); }
      const { data: conv } = await supabase.rpc('start_conversation', { p_animal_id: animal });
      setBusy(false);
      return router.replace({ pathname: '/chat/[id]', params: { id: conv as string, pedido: 'enviado' } });
    }
    setBusy(false);
    router.back();
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      {name ? (
        <Text style={[s.body, { backgroundColor: C.accentSoft, padding: 12, borderRadius: 12, overflow: 'hidden' }]}>
          Falta pouco para pedir a adoção de <Text style={{ fontWeight: '800' }}>{name}</Text>. Esses dados protegem os animais e as ONGs.
        </Text>
      ) : null}

      <Field label="CPF" value={cpf} onChangeText={(v) => setCpf(formatCpf(v))} keyboardType="number-pad" placeholder="000.000.000-00"
        hint="A ONG vê apenas “CPF verificado”, nunca o número." />

      <View style={{ gap: 6 }}>
        <Field label="Celular" value={phone} editable={!phoneVerified} onChangeText={(v) => { setPhone(formatPhone(v)); setCodeSent(false); }}
          keyboardType="phone-pad" placeholder="(16) 90000-0000" hint="Só é compartilhado com a ONG depois que ela aprovar seu pedido." />
        {phoneVerified ? (
          <Text style={{ color: C.brandDark, fontWeight: '700' }}>✓ Celular verificado</Text>
        ) : (
          <Button title={codeSent ? 'Reenviar código' : 'Enviar código por SMS'} variant="outline" onPress={sendCode} />
        )}
        {codeSent && !phoneVerified && (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}><Field label="Código" value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="6 dígitos" /></View>
            <Button title="Confirmar" onPress={verify} />
          </View>
        )}
        {msg && <Text style={s.hint}>{msg}</Text>}
      </View>

      <View style={{ gap: 6 }}>
        <Field label="CEP" value={cep} onChangeText={onCep} keyboardType="number-pad" placeholder="00000-000" />
        {addr && <Text style={{ fontSize: 12, fontWeight: '600', color: C.brandDark }}>✓ {[addr.neighborhood, `${addr.city}/${addr.state}`].filter(Boolean).join(' · ')}</Text>}
      </View>
      <Field label="Endereço" value={street} onChangeText={setStreet} placeholder="Rua e número" />
      <Field label="Complemento" value={complement} onChangeText={setComplement} placeholder="Apto, bloco (opcional)" />

      <View style={{ gap: 8 }}>
        <Text style={s.label}>Onde você mora?</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(Object.keys(HOME_LABEL) as HomeType[]).map((h) => (
            <Pressable key={h} accessibilityRole="button" accessibilityState={{ selected: home === h }} onPress={() => setHome(h)}
              style={{ flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: home === h ? C.brand : C.white, borderWidth: home === h ? 0 : 1.5, borderColor: C.line2 }}>
              <Text style={{ fontWeight: '600', color: home === h ? C.white : C.ink }}>{HOME_LABEL[h]}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Toggle label="Tenho quintal" value={yard} onChange={setYard} />
      <Toggle label="Tenho crianças em casa" value={kids} onChange={setKids} />
      <Field label="Outros animais em casa" value={pets} onChangeText={setPets} placeholder="Ex.: 1 gato castrado" />
      <Toggle label="Concordo com o uso dos meus dados para análise de adoção (LGPD)" value={consent} onChange={setConsent} />

      {error && <Text style={s.error}>{error}</Text>}
      <Button title={animal ? 'Salvar e enviar pedido' : 'Salvar perfil'} onPress={save} loading={busy} />
    </ScrollView>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <Text style={[s.body, { flex: 1 }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: C.brand, false: C.line2 }} accessibilityLabel={label} />
    </View>
  );
}
