import { getI18n } from '@/i18n/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { formatCnpj, formatPhone, parseOpeningHours } from '@adotai/shared';
import { createClient } from '@/lib/supabase/server';
import { getMyNgo } from '@/lib/ngo';
import { HoursEditor } from './hours-editor';

/** Aceita @usuario, usuario ou o link do perfil; guarda só o nome de usuário. */
function normalizeInstagram(v: string): string | null {
  const u = v.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').split(/[/?#]/)[0];
  return /^[A-Za-z0-9._]{1,30}$/.test(u) ? u : null;
}

/** WhatsApp no formato do wa.me: 55 + DDD + número (aceita com ou sem máscara/55). */
function normalizeWhatsapp(v: string): string | null {
  let d = v.replace(/\D/g, '');
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return /^55[1-9][0-9][0-9]{8,9}$/.test(d) ? d : null;
}

async function save(ngoId: string, fd: FormData) {
  'use server';
  const supabase = await createClient();
  let hours = null;
  try { hours = parseOpeningHours(JSON.parse(String(fd.get('opening_hours') || 'null'))); } catch { hours = null; }
  const { error } = await supabase.from('ngos').update({
    description: String(fd.get('description') || '') || null,
    email: String(fd.get('email') || '') || null,
    phone: String(fd.get('phone') || '') || null,
    whatsapp: normalizeWhatsapp(String(fd.get('whatsapp') || '')),
    pix_key: String(fd.get('pix_key') || '') || null,
    instagram: normalizeInstagram(String(fd.get('instagram') || '')),
    opening_hours: hours,
    application_questions: [0, 1, 2, 3, 4].map((i) => String(fd.get(`q${i}`) ?? '').trim().slice(0, 200)).filter(Boolean),
  }).eq('id', ngoId);
  revalidatePath('/painel/ong');
  redirect(error ? '/painel/ong?erro=1' : '/painel/ong?salvo=1');
}

export default async function Page({ searchParams }: { searchParams: Promise<{ salvo?: string; erro?: string }> }) {
  const { salvo, erro } = await searchParams;
  const { ngo } = await getMyNgo();
  const { t } = await getI18n();
  const n = ngo!;
  const questions = (Array.isArray(n.application_questions) ? n.application_questions : []) as unknown[];
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t('Dados da ONG')}</h1>
      <p className="text-sm text-muted">{n.name} · CNPJ {formatCnpj(n.cnpj)} · {n.neighborhood}, {n.city}/{n.state}</p>
      {salvo && <p role="status" className="rounded-xl bg-brand-soft p-3 text-sm font-semibold text-brand-dark">{t('Dados salvos.')}</p>}
      {erro && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{t('Não foi possível salvar. Tente de novo.')}</p>}
      <form action={save.bind(null, n.id)} className="card flex flex-col gap-4 p-5 sm:p-6">
        <label className="flex flex-col gap-1.5"><span className="label">{t('Sobre a ONG')}</span><textarea name="description" rows={4} defaultValue={n.description ?? ''} className="field h-auto py-3" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5"><span className="label">{t('E-mail')}</span><input name="email" type="email" defaultValue={n.email ?? ''} className="field" /></label>
          <label className="flex flex-col gap-1.5"><span className="label">{t('Telefone')}</span><input name="phone" inputMode="tel" defaultValue={n.phone ?? ''} className="field" /></label>
        </div>
        <label className="flex flex-col gap-1.5"><span className="label">{t('WhatsApp')}</span>
          <input name="whatsapp" inputMode="tel" defaultValue={n.whatsapp ? formatPhone(n.whatsapp.replace(/^55/, '')) : ''} placeholder="(16) 99999-0000" className="field" />
          <span className="text-xs text-muted">{t('Adotantes logados veem um botão para chamar a ONG no WhatsApp. Deixe vazio para não mostrar.')}</span>
        </label>
        <label className="flex flex-col gap-1.5"><span className="label">{t('Instagram')}</span>
          <span className="flex items-center rounded-xl bg-white ring-[1.5px] ring-line-2 ring-inset focus-within:ring-brand">
            <span className="pl-3.5 text-muted">@</span>
            <input name="instagram" defaultValue={n.instagram ?? ''} placeholder={t('usuario_da_ong')} autoCapitalize="none" className="h-12 w-full min-w-0 bg-transparent pr-3.5 pl-1 text-[15px] outline-none" />
          </span>
          <span className="text-xs text-muted">{t('Aparece na página pública da ONG.')}</span>
        </label>
        <HoursEditor initial={parseOpeningHours(n.opening_hours)} />
        <label className="flex flex-col gap-1.5"><span className="label">{t('Chave Pix para doações (aparece na página pública)')}</span>
          <input name="pix_key" defaultValue={n.pix_key ?? ''} placeholder={t('CNPJ, e-mail, celular ou chave aleatória')} className="field" />
          <span className="text-xs text-muted">{t('O site gera o QR Code e o Pix copia e cola. O dinheiro vai direto para a ONG.')}</span>
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="label mb-1">{t('Perguntas para quem pede adoção (até 5, opcional)')}</legend>
          <span className="text-xs text-muted">{t('Aparecem no botão "Quero adotar". As respostas chegam junto com o pedido.')}</span>
          {[0, 1, 2, 3, 4].map((i) => (
            <input key={i} name={`q${i}`} maxLength={200} defaultValue={(questions[i] as string) ?? ''}
              placeholder={[t('Ex.: Você já teve animais? Como foi?'), t('Ex.: Quem cuida do animal nas viagens?'), t('Ex.: A casa tem tela nas janelas?'), '', ''][i]} className="field" />
          ))}
        </fieldset>
        <button className="btn-primary self-start">{t('Salvar')}</button>
      </form>
    </div>
  );
}
