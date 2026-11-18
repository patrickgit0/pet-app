import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { HOME_LABEL, REQUEST_STATUS_LABEL, formatDistance, formatPhone, rpcErrorMessage, type RequestStatus } from '@adotai/shared';
import { createClient } from '@/lib/supabase/server';
import { getMyNgo } from '@/lib/ngo';
import { CheckIcon } from '@/components/icons';

async function setStatus(requestId: string, status: RequestStatus, formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { error } = await supabase.rpc('set_request_status', {
    p_request_id: requestId, p_status: status, p_reason: String(formData.get('reason') ?? '') || undefined,
  });
  if (error) redirect(`/painel/pedidos/${requestId}?erro=${encodeURIComponent(rpcErrorMessage(error.message))}`);
  revalidatePath(`/painel/pedidos/${requestId}`);
}

async function completeAdoption(requestId: string) {
  'use server';
  const supabase = await createClient();
  const { error } = await supabase.rpc('complete_adoption', { p_request_id: requestId });
  if (error) redirect(`/painel/pedidos/${requestId}?erro=${encodeURIComponent(rpcErrorMessage(error.message))}`);
  redirect('/painel/pos-adocao?nova=1');
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erro?: string }> }) {
  const { id } = await params;
  const { erro } = await searchParams;
  const { supabase } = await getMyNgo();
  const { t, lang } = await getI18n();

  const { data: req } = await supabase.from('adoption_requests').select('*, animals(id, name)').eq('id', id).maybeSingle();
  if (!req) notFound();
  const { data: summary } = await supabase.rpc('get_candidate_summary', { p_request_id: id });
  const c = summary?.[0];
  const { data: contact } = req.status === 'approved' ? await supabase.rpc('get_adopter_contact', { p_request_id: id }) : { data: null };
  const ct = contact?.[0];
  const { data: conv } = await supabase.from('conversations').select('id').eq('animal_id', req.animal_id).eq('adopter_id', req.adopter_id).maybeSingle();
  const { data: adoption } = await supabase.from('adoptions').select('id').eq('request_id', id).maybeSingle();
  const open = ['sent', 'reviewing', 'visit_scheduled'].includes(req.status);

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <Link href="/painel/pedidos" className="text-sm font-semibold text-brand">← {t('Candidatos')}</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{c?.full_name} · {req.animals?.name}</h1>
        <span className="rounded-lg bg-accent-soft px-2.5 py-1 text-sm font-bold text-accent-ink">{t(REQUEST_STATUS_LABEL[req.status])}</span>
      </div>
      {erro && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{t(erro)}</p>}

      <section className="card grid gap-3 p-5 text-sm sm:grid-cols-2">
        <Info k={t('Celular')} v={c?.phone ? <a href={`tel:${c.phone}`} className="font-bold text-brand underline">{formatPhone(c.phone.replace(/^\+55/, ''))}</a> : '—'} />
        <Info k={t('Verificação')} v={<span className="flex items-center gap-1 font-bold text-brand-dark">{c?.cpf_verified ? <><CheckIcon size={14} /> {t('CPF verificado')}</> : t('Incompleta')}</span>} />
        <Info k={t('Bairro')} v={`${c?.neighborhood ?? '—'}${c?.distance_km != null ? ` · ${t('{d} da ONG', { d: formatDistance(Number(c.distance_km), lang) })}` : ''}`} />
        <Info k={t('Moradia')} v={c?.home_type ? t(HOME_LABEL[c.home_type]) : '—'} />
        <Info k={t('Quintal')} v={c?.has_yard == null ? '—' : c.has_yard ? t('Sim') : t('Não')} />
        <Info k={t('Crianças em casa')} v={c?.has_children == null ? '—' : c.has_children ? t('Sim') : t('Não')} />
        <Info k={t('Outros animais')} v={c?.other_pets || '—'} />
      </section>

      {ct ? (
        <section className="card flex flex-col gap-1 border-brand p-5 text-sm">
          <h2 className="mb-1 font-extrabold">{t('Contato do adotante')}</h2>
          <span>{t('Endereço:')} <strong>{ct.street}{ct.complement ? `, ${ct.complement}` : ''} — {ct.neighborhood}, {ct.city}/{ct.state} · CEP {ct.cep}</strong></span>
        </section>
      ) : (
        <p className="text-xs text-muted">{t('O endereço completo aparece aqui depois que você aprovar o pedido. O CPF nunca é exibido.')}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {conv && <Link href={`/mensagens/${conv.id}`} className="btn-ghost">{t('Abrir conversa')}</Link>}
        {req.status === 'sent' && <form action={setStatus.bind(null, id, 'reviewing')}><button className="btn-ghost">{t('Marcar em análise')}</button></form>}
        {open && <form action={setStatus.bind(null, id, 'visit_scheduled')}><button className="btn-ghost">{t('Visita marcada')}</button></form>}
        {open && <form action={setStatus.bind(null, id, 'approved')}><button className="btn-primary">{t('Aprovar pedido')}</button></form>}
        {req.status === 'approved' && !adoption && (
          <form action={completeAdoption.bind(null, id)}><button className="btn-primary">{t('Confirmar adoção (animal entregue)')}</button></form>
        )}
      </div>
      {open && (
        <form action={setStatus.bind(null, id, 'rejected')} className="card flex flex-col gap-2 p-4">
          <label className="label" htmlFor="reason">{t('Recusar pedido')}</label>
          <span className="text-xs text-muted">{t('O motivo é opcional. Se escrever, o adotante verá a mensagem.')}</span>
          <input id="reason" name="reason" placeholder={t('Motivo (opcional)')} className="field" />
          <button className="btn self-start text-red-700 ring-[1.5px] ring-red-200 ring-inset">{t('Recusar')}</button>
        </form>
      )}
    </div>
  );
}

function Info({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex flex-col"><span className="text-xs text-muted">{k}</span><span className="font-semibold">{v}</span></div>;
}
