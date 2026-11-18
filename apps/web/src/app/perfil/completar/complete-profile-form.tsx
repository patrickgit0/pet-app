'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatCep, formatCpf, formatPhone, isValidCpf, lookupCep, rpcErrorMessage, toE164Phone, HOME_LABEL, type CepResult, type HomeType } from '@adotai/shared';
import { createClient } from '@/lib/supabase/client';
import { CheckIcon } from '@/components/icons';
import { requestAdoption } from '@/app/animais/[id]/actions';

type Initial = {
  cpf: string; phone: string; phoneVerified: boolean; cep: string; street: string; complement: string;
  homeType: HomeType | null; hasYard: boolean | null; hasChildren: boolean | null; otherPets: string;
};

export function CompleteProfileForm({ initial, animalId, animalName }: { initial: Initial; animalId?: string; animalName?: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [cpf, setCpf] = useState(formatCpf(initial.cpf));
  const [phone, setPhone] = useState(formatPhone(initial.phone.replace(/^\+55/, '')));
  const [phoneVerified, setPhoneVerified] = useState(initial.phoneVerified);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [phoneMsg, setPhoneMsg] = useState<string | null>(null);

  const [cep, setCep] = useState(formatCep(initial.cep));
  const [addr, setAddr] = useState<CepResult | null>(null);
  const [cepMsg, setCepMsg] = useState<string | null>(null);
  const [street, setStreet] = useState(initial.street);
  const [complement, setComplement] = useState(initial.complement);

  const [homeType, setHomeType] = useState<HomeType | null>(initial.homeType);
  const [hasYard, setHasYard] = useState<boolean>(initial.hasYard ?? false);
  const [hasChildren, setHasChildren] = useState<boolean>(initial.hasChildren ?? false);
  const [otherPets, setOtherPets] = useState(initial.otherPets);
  const [consent, setConsent] = useState(false);

  async function onCep(value: string) {
    const v = formatCep(value);
    setCep(v);
    setAddr(null);
    setCepMsg(null);
    if (v.replace(/\D/g, '').length === 8) {
      setCepMsg('Buscando…');
      const r = await lookupCep(v);
      if (!r) return setCepMsg('CEP não encontrado.');
      setAddr(r);
      setCepMsg(null);
      if (!street && r.street) setStreet(`${r.street}, `);
    }
  }

  async function sendCode() {
    setPhoneMsg(null);
    const e164 = toE164Phone(phone);
    if (!e164) return setPhoneMsg('Celular inválido.');
    const { error } = await supabase.auth.updateUser({ phone: e164 });
    if (error) return setPhoneMsg('Não foi possível enviar o SMS. Tente novamente em instantes.');
    setCodeSent(true);
    setPhoneMsg('Enviamos um código por SMS.');
  }

  async function verifyCode() {
    const e164 = toE164Phone(phone)!;
    const { error } = await supabase.auth.verifyOtp({ phone: e164, token: code.trim(), type: 'phone_change' });
    if (error) return setPhoneMsg('Código incorreto ou expirado.');
    await supabase.rpc('sync_phone_verification');
    setPhoneVerified(true);
    setPhoneMsg(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidCpf(cpf)) return setError('CPF inválido.');
    if (!phoneVerified) return setError('Confirme seu celular com o código por SMS.');
    if (!addr) return setError('Informe um CEP válido.');
    if (!street.trim()) return setError('Informe o endereço.');
    if (!homeType) return setError('Diga onde você mora.');
    if (!consent) return setError('É preciso aceitar a Política de Privacidade.');

    start(async () => {
      const { error } = await supabase.rpc('complete_profile', {
        p_cpf: cpf, p_phone: toE164Phone(phone)!, p_cep: cep, p_street: street, p_complement: complement,
        p_neighborhood: addr.neighborhood ?? '', p_city: addr.city, p_state: addr.state,
        p_lat: addr.lat ?? undefined, p_lng: addr.lng ?? undefined,
        p_home_type: homeType, p_has_yard: hasYard, p_has_children: hasChildren, p_other_pets: otherPets,
        p_lgpd_consent: consent,
      } as never);
      if (error) return setError(rpcErrorMessage(error.message));
      if (animalId) await requestAdoption(animalId); // redireciona para o chat com o pedido enviado
      else router.push('/perfil?salvo=1');
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {animalName && (
        <p className="rounded-xl bg-accent-soft p-3 text-sm text-ink-2">
          Falta pouco para pedir a adoção de <strong>{animalName}</strong>. Esses dados protegem os animais e as ONGs.
        </p>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="label">CPF</span>
        <input inputMode="numeric" value={cpf} onChange={(e) => setCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" className="field" required />
        <span className="text-xs text-muted">A ONG vê apenas &quot;CPF verificado&quot;, nunca o número.</span>
      </label>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cel" className="label">Celular</label>
        <div className="flex gap-2">
          <input id="cel" inputMode="tel" value={phone} disabled={phoneVerified}
            onChange={(e) => { setPhone(formatPhone(e.target.value)); setCodeSent(false); }}
            placeholder="(16) 90000-0000" className="field flex-1" />
          {phoneVerified ? (
            <span className="btn bg-brand-soft text-brand-dark"><CheckIcon size={16} /> Verificado</span>
          ) : (
            <button type="button" onClick={sendCode} className="btn bg-brand-soft text-brand-dark">{codeSent ? 'Reenviar' : 'Enviar código'}</button>
          )}
        </div>
        {codeSent && !phoneVerified && (
          <div className="flex gap-2">
            <input aria-label="Código recebido por SMS" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código de 6 dígitos" className="field flex-1 tracking-[2px]" />
            <button type="button" onClick={verifyCode} className="btn-primary">Confirmar</button>
          </div>
        )}
        {phoneMsg && <span className="text-xs text-muted">{phoneMsg}</span>}
        <span className="text-xs text-muted">Só é compartilhado com a ONG depois que ela aprovar seu pedido.</span>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="label">CEP</span>
        <input inputMode="numeric" value={cep} onChange={(e) => onCep(e.target.value)} placeholder="00000-000" className="field" required />
        {addr && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-dark">
            <CheckIcon size={14} /> {[addr.neighborhood, `${addr.city}/${addr.state}`].filter(Boolean).join(' · ')}
          </span>
        )}
        {cepMsg && <span className="text-xs text-muted">{cepMsg}</span>}
      </label>

      <div className="grid grid-cols-[2fr_1fr] gap-2">
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="label">Endereço</span>
          <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua e número" className="field" required />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="label">Complemento</span>
          <input value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto, bloco" className="field" />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="label mb-2">Onde você mora?</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(HOME_LABEL) as HomeType[]).map((h) => (
            <button key={h} type="button" aria-pressed={homeType === h} onClick={() => setHomeType(h)}
              className={`btn ${homeType === h ? 'bg-brand text-white' : 'ring-[1.5px] ring-line-2 ring-inset'}`}>
              {HOME_LABEL[h]}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-5 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={hasYard} onChange={(e) => setHasYard(e.target.checked)} className="h-5 w-5 accent-brand" /> Tenho quintal</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={hasChildren} onChange={(e) => setHasChildren(e.target.checked)} className="h-5 w-5 accent-brand" /> Tenho crianças em casa</label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="label">Outros animais em casa</span>
        <input value={otherPets} onChange={(e) => setOtherPets(e.target.value)} placeholder="Ex.: 1 gato castrado" className="field" />
      </label>

      <label className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-2">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
        <span>Concordo com o uso dos meus dados para análise de adoção, conforme a <a href="/privacidade" target="_blank" className="font-bold text-brand underline">Política de Privacidade</a> (LGPD).</span>
      </label>

      {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
      <button disabled={pending} className="btn-primary h-13 text-base font-extrabold">
        {pending ? 'Salvando…' : animalId ? 'Salvar e enviar pedido' : 'Salvar perfil'}
      </button>
    </form>
  );
}
