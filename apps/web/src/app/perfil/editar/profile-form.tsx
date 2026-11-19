'use client';

import { useI18n } from '@/i18n/client';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatCep, formatCpf, formatPhone, isValidCpf, lookupCep, rpcErrorMessage, toE164Phone, HOME_LABEL, type CepResult, type HomeType } from '@adotai/shared';
import { createClient } from '@/lib/supabase/client';
import { CheckIcon } from '@/components/icons';

type Initial = {
  fullName: string; cpf: string; phone: string; cep: string; street: string; complement: string;
  homeType: HomeType | null; hasYard: boolean | null; hasChildren: boolean | null; otherPets: string; consented: boolean; isAdopter: boolean;
};

/**
 * Edição permanente do perfil. "Seus dados" salva sempre; "Para adotar" (CPF, celular, endereço)
 * só é obrigatório quando a pessoa vem de um pedido de adoção ou começa a preencher.
 */
export function ProfileForm({ initial, animalId, animalName }: { initial: Initial; animalId?: string; animalName?: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  const [fullName, setFullName] = useState(initial.fullName);
  const cpfLocked = Boolean(initial.cpf);
  const [cpf, setCpf] = useState(formatCpf(initial.cpf));
  const [phone, setPhone] = useState(formatPhone(initial.phone.replace(/^\+55/, '')));
  const [phoneMsg, setPhoneMsg] = useState<string | null>(null);

  const [cep, setCep] = useState(formatCep(initial.cep));
  const [addr, setAddr] = useState<CepResult | null>(null);
  const [cepMsg, setCepMsg] = useState<string | null>(initial.cep ? 'Confira o CEP para atualizar o bairro.' : null);
  const [street, setStreet] = useState(initial.street);
  const [complement, setComplement] = useState(initial.complement);

  const [homeType, setHomeType] = useState<HomeType | null>(initial.homeType);
  const [hasYard, setHasYard] = useState<boolean>(initial.hasYard ?? false);
  const [hasChildren, setHasChildren] = useState<boolean>(initial.hasChildren ?? false);
  const [otherPets, setOtherPets] = useState(initial.otherPets);
  const [consent, setConsent] = useState(initial.consented);

  // CEP já salvo: busca de novo em segundo plano para ter cidade/bairro/coordenadas na hora de salvar
  useEffect(() => {
    if (!initial.cep) return;
    let alive = true;
    lookupCep(initial.cep).then((r) => { if (alive && r) { setAddr(r); setCepMsg(null); } });
    return () => { alive = false; };
  }, [initial.cep]);

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

  // Sem SMS: o número só é validado (celular brasileiro: DDD + 9 dígitos começando com 9)
  const validPhone = (v: string) => /^\+55[1-9][1-9]9\d{8}$/.test(toE164Phone(v) ?? '');

  const adoptionTouched = Boolean(animalId || (!cpfLocked && cpf) || phone || cep || street);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fullName.trim().split(/\s+/).length < 2) return setError('Informe seu nome completo.');
    if (adoptionTouched && initial.isAdopter) {
      if (!isValidCpf(cpf)) return setError('CPF inválido.');
      if (!validPhone(phone)) return setError('Informe um celular válido com DDD, ex.: (16) 99123-4567.');
      if (!addr) return setError('Informe um CEP válido.');
      if (!street.trim()) return setError('Informe o endereço.');
      if (!homeType) return setError('Diga onde você mora.');
      if (!consent) return setError('É preciso aceitar a Política de Privacidade.');
    }

    start(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: e1 } = await supabase.from('profiles').update({
        full_name: fullName.trim(), home_type: homeType, has_yard: hasYard, has_children: hasChildren, other_pets: otherPets || null,
      }).eq('id', user!.id);
      if (e1) return setError('Não foi possível salvar. Tente de novo.');

      if (adoptionTouched && initial.isAdopter && addr) {
        const { error } = await supabase.rpc('complete_profile', {
          p_cpf: cpf, p_phone: toE164Phone(phone)!, p_cep: cep, p_street: street, p_complement: complement,
          p_neighborhood: addr.neighborhood ?? '', p_city: addr.city, p_state: addr.state,
          p_lat: addr.lat ?? undefined, p_lng: addr.lng ?? undefined,
          p_home_type: homeType!, p_has_yard: hasYard, p_has_children: hasChildren, p_other_pets: otherPets,
          p_lgpd_consent: consent,
        } as never);
        if (error) return setError(rpcErrorMessage(error.message));
      }
      // Volta para o anúncio: lá a pessoa marca o compromisso, responde as perguntas da ONG e envia o pedido
      if (animalId) { router.push(`/animais/${animalId}?perfil=ok#pedido`); router.refresh(); }
      else { router.push('/perfil?salvo=1'); router.refresh(); }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {animalName && (
        <p className="rounded-xl bg-accent-soft p-3 text-sm text-ink-2">
          {t('Falta pouco para pedir a adoção de')} <strong>{animalName}</strong>. {t('Esses dados protegem os animais e as ONGs.')}
        </p>
      )}

      <section className="card flex flex-col gap-4 p-5">
        <h2 className="font-extrabold">{t('Seus dados')}</h2>
        <label className="flex flex-col gap-1.5">
          <span className="label">{t('Nome completo')}</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" className="field" required />
        </label>
      </section>

      {initial.isAdopter && (
        <section className="card flex flex-col gap-4 p-5">
          <div>
            <h2 className="font-extrabold">{t('Para adotar')}</h2>
            <p className="text-xs text-muted">{t('Só é obrigatório na hora de pedir uma adoção. A ONG nunca vê seu CPF.')}</p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="label">{t('CPF')}</span>
            <input inputMode="numeric" value={cpfLocked ? `•••.•••.•••-${initial.cpf.slice(-2)}` : cpf} disabled={cpfLocked}
              onChange={(e) => setCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" className="field disabled:bg-field disabled:text-muted" />
            {cpfLocked && <span className="text-xs text-muted">{t('O CPF não pode ser alterado. Precisa corrigir? Fale com o suporte.')}</span>}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="label">{t('Celular')}</span>
            <input inputMode="tel" autoComplete="tel-national" value={phone}
              onChange={(e) => { const v = formatPhone(e.target.value); setPhone(v); setPhoneMsg(null); }}
              onBlur={() => setPhoneMsg(phone && !validPhone(phone) ? 'Confira o número: DDD + celular com 9 dígitos.' : null)}
              placeholder="(16) 99123-4567" className="field" />
            {phoneMsg ? <span className="text-xs text-red-700">{t(phoneMsg)}</span>
              : <span className="text-xs text-muted">{t('A ONG vê seu celular quando você pede uma adoção. O CPF nunca aparece para ela.')}</span>}
          </label>

          <div className="grid grid-cols-[1fr_2fr] gap-2">
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="label">{t('CEP')}</span>
              <input inputMode="numeric" autoComplete="postal-code" value={cep} onChange={(e) => onCep(e.target.value)} placeholder="00000-000" className="field" />
            </label>
            <div className="flex min-w-0 flex-col justify-end pb-3 text-xs">
              {addr ? (
                <span className="flex items-center gap-1 font-semibold text-brand-dark"><CheckIcon size={13} /> {[addr.neighborhood, `${addr.city}/${addr.state}`].filter(Boolean).join(' · ')}</span>
              ) : cepMsg && <span className="text-muted">{t(cepMsg)}</span>}
            </div>
          </div>

          <div className="grid grid-cols-[2fr_1fr] gap-2">
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="label">{t('Endereço')}</span>
              <input value={street} onChange={(e) => setStreet(e.target.value)} autoComplete="address-line1" placeholder={t('Rua e número')} className="field" />
            </label>
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="label">{t('Complemento')}</span>
              <input value={complement} onChange={(e) => setComplement(e.target.value)} autoComplete="address-line2" placeholder={t('Apto')} className="field" />
            </label>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="label mb-2">{t('Onde você mora?')}</legend>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(HOME_LABEL) as HomeType[]).map((h) => (
                <button key={h} type="button" aria-pressed={homeType === h} onClick={() => setHomeType(h)}
                  className={`btn px-2 ${homeType === h ? 'bg-brand text-white' : 'ring-[1.5px] ring-line-2 ring-inset'}`}>
                  {t(HOME_LABEL[h])}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <label className="flex min-h-8 items-center gap-2"><input type="checkbox" checked={hasYard} onChange={(e) => setHasYard(e.target.checked)} className="h-5 w-5 accent-brand" /> {t('Tenho quintal')}</label>
            <label className="flex min-h-8 items-center gap-2"><input type="checkbox" checked={hasChildren} onChange={(e) => setHasChildren(e.target.checked)} className="h-5 w-5 accent-brand" /> {t('Crianças em casa')}</label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="label">{t('Outros animais em casa')}</span>
            <input value={otherPets} onChange={(e) => setOtherPets(e.target.value)} placeholder={t('Ex.: 1 gato castrado')} className="field" />
          </label>

          {!initial.consented && (
            <label className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-2">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand" />
              <span>{t('Concordo com o uso dos meus dados para análise de adoção, conforme a')} <a href="/privacidade" target="_blank" className="font-bold text-brand underline">{t('Política de Privacidade')}</a> (LGPD).</span>
            </label>
          )}
        </section>
      )}

      {error && <p role="alert" className="text-sm font-semibold text-red-700">{t(error)}</p>}
      <button disabled={pending} className="btn-primary h-12 text-base">
        {pending ? t('Salvando…') : animalId ? t('Salvar e voltar ao pedido') : t('Salvar')}
      </button>
    </form>
  );
}
