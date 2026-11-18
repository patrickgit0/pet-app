'use client';

import { useI18n } from '@/i18n/client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatCep, formatCnpj, isValidCnpj, lookupCep, type CepResult } from '@adotai/shared';
import { createClient } from '@/lib/supabase/client';

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function NgoSignupForm() {
  const supabase = createClient();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cnpj, setCnpj] = useState('');
  const [cep, setCep] = useState('');
  const [addr, setAddr] = useState<CepResult | null>(null);
  const { t } = useI18n();

  return (
    <form
      className="card flex flex-col gap-4 p-5 sm:p-6"
      action={(fd) => {
        setError(null);
        if (!isValidCnpj(cnpj)) return setError('CNPJ inválido. No momento aceitamos apenas ONGs com CNPJ.');
        if (!addr || addr.lat == null || addr.lng == null) return setError('Informe um CEP válido para localizarmos a ONG.');
        const name = String(fd.get('name')).trim();
        start(async () => {
          const { error } = await supabase.rpc('create_ngo', {
            p_name: name, p_slug: slugify(name), p_cnpj: cnpj, p_city: addr.city, p_state: addr.state,
            p_lat: addr.lat!, p_lng: addr.lng!, p_neighborhood: addr.neighborhood ?? undefined,
            p_address_text: String(fd.get('address') || '') || undefined,
            p_description: String(fd.get('description') || '') || undefined,
            p_email: String(fd.get('email') || '') || undefined, p_phone: String(fd.get('phone') || '') || undefined,
          });
          if (error) return setError(error.message.includes('duplicate') ? 'Já existe uma ONG com este CNPJ ou nome.' : 'Não foi possível cadastrar.');
          router.push('/painel');
          router.refresh();
        });
      }}
    >
      <label className="flex flex-col gap-1.5"><span className="label">{t('Nome da ONG')}</span><input name="name" required className="field" /></label>
      <label className="flex flex-col gap-1.5"><span className="label">{t('CNPJ')}</span>
        <input value={cnpj} onChange={(e) => setCnpj(formatCnpj(e.target.value))} inputMode="numeric" placeholder="00.000.000/0000-00" className="field" required />
      </label>
      <label className="flex flex-col gap-1.5"><span className="label">{t('CEP da sede ou do abrigo')}</span>
        <input value={cep} inputMode="numeric" placeholder="00000-000" className="field" required onChange={async (e) => {
          const v = formatCep(e.target.value); setCep(v); setAddr(null);
          if (v.length === 9) setAddr(await lookupCep(v));
        }} />
        {addr && <span className="text-xs font-semibold text-brand-dark">{[addr.neighborhood, `${addr.city}/${addr.state}`].filter(Boolean).join(' · ')}</span>}
      </label>
      <label className="flex flex-col gap-1.5"><span className="label">{t('Endereço (não aparece publicamente)')}</span><input name="address" className="field" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5"><span className="label">{t('E-mail de contato')}</span><input name="email" type="email" className="field" /></label>
        <label className="flex flex-col gap-1.5"><span className="label">{t('Telefone')}</span><input name="phone" className="field" /></label>
      </div>
      <label className="flex flex-col gap-1.5"><span className="label">{t('Sobre a ONG')}</span><textarea name="description" rows={3} className="field h-auto py-3" /></label>
      {error && <p role="alert" className="text-sm font-semibold text-red-700">{t(error)}</p>}
      <button disabled={pending} className="btn-primary h-12">{pending ? t('Cadastrando…') : t('Cadastrar ONG')}</button>
      <p className="text-xs text-muted">{t('Depois do cadastro, nossa equipe verifica o CNPJ. Você já pode cadastrar animais enquanto isso.')}</p>
    </form>
  );
}
