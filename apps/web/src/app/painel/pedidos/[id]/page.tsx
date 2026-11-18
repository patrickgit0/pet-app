import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { HOME_LABEL, REQUEST_STATUS_LABEL, formatDistance, rpcErrorMessage, type RequestStatus } from '@adotai/shared';
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
      <Link href="/painel/pedidos" className="text-sm font-semibold text-brand">← Candidatos</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{c?.full_name} · {req.animals?.name}</h1>
        <span className="rounded-lg bg-accent-soft px-2.5 py-1 text-sm font-bold text-accent-ink">{REQUEST_STATUS_LABEL[req.status]}</span>
      </div>
      {erro && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{erro}</p>}

      <section className="card grid gap-3 p-5 text-sm sm:grid-cols-2">
        <Info k="Verificação" v={<span className="flex items-center gap-1 font-bold text-brand-dark">{c?.cpf_verified ? <><CheckIcon size={14} /> CPF verificado · celular informado</> : 'Incompleta'}</span>} />
        <Info k="Bairro" v={`${c?.neighborhood ?? '—'}${c?.distance_km != null ? ` · ${formatDistance(Number(c.distance_km))} da ONG` : ''}`} />
        <Info k="Moradia" v={c?.home_type ? HOME_LABEL[c.home_type] : '—'} />
        <Info k="Quintal" v={c?.has_yard == null ? '—' : c.has_yard ? 'Sim' : 'Não'} />
        <Info k="Crianças em casa" v={c?.has_children == null ? '—' : c.has_children ? 'Sim' : 'Não'} />
        <Info k="Outros animais" v={c?.other_pets || '—'} />
      </section>

      {ct ? (
        <section className="card flex flex-col gap-1 border-brand p-5 text-sm">
          <h2 className="mb-1 font-extrabold">Contato do adotante</h2>
          <span>Celular: <strong>{ct.phone}</strong></span>
          <span>Endereço: <strong>{ct.street}{ct.complement ? `, ${ct.complement}` : ''} — {ct.neighborhood}, {ct.city}/{ct.state} · CEP {ct.cep}</strong></span>
        </section>
      ) : (
        <p className="text-xs text-muted">Celular e endereço completo aparecem aqui depois que você aprovar o pedido. O CPF nunca é exibido.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {conv && <Link href={`/mensagens/${conv.id}`} className="btn-ghost">Abrir conversa</Link>}
        {req.status === 'sent' && <form action={setStatus.bind(null, id, 'reviewing')}><button className="btn-ghost">Marcar em análise</button></form>}
        {open && <form action={setStatus.bind(null, id, 'visit_scheduled')}><button className="btn-ghost">Visita marcada</button></form>}
        {open && <form action={setStatus.bind(null, id, 'approved')}><button className="btn-primary">Aprovar pedido</button></form>}
        {req.status === 'approved' && !adoption && (
          <form action={completeAdoption.bind(null, id)}><button className="btn-primary">Confirmar adoção (animal entregue)</button></form>
        )}
      </div>
      {open && (
        <form action={setStatus.bind(null, id, 'rejected')} className="card flex flex-col gap-2 p-4">
          <label className="label" htmlFor="reason">Recusar pedido</label>
          <input id="reason" name="reason" placeholder="Motivo (o adotante verá esta mensagem)" className="field" required />
          <button className="btn self-start text-red-700 ring-[1.5px] ring-red-200 ring-inset">Recusar</button>
        </form>
      )}
    </div>
  );
}

function Info({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex flex-col"><span className="text-xs text-muted">{k}</span><span className="font-semibold">{v}</span></div>;
}
