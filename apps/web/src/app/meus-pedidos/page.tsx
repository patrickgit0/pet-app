import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { REQUEST_STATUS_LABEL } from '@adotai/shared';
import { createClient, getSession } from '@/lib/supabase/server';

export const metadata = { title: 'Meus pedidos' };

async function cancel(id: string) {
  'use server';
  const supabase = await createClient();
  await supabase.rpc('cancel_adoption_request', { p_request_id: id });
  revalidatePath('/meus-pedidos');
}

async function answerCheckin(id: string, formData: FormData) {
  'use server';
  const supabase = await createClient();
  await supabase.rpc('answer_checkin', {
    p_checkin_id: id,
    p_answers: { adaptacao: String(formData.get('adaptacao') ?? ''), comentario: String(formData.get('comentario') ?? '') },
    p_needs_help: formData.get('needs_help') === 'on',
  });
  revalidatePath('/meus-pedidos');
}

export default async function Page() {
  const { supabase, user } = await getSession();
  const [{ data: requests }, { data: checkins }] = await Promise.all([
    supabase.from('adoption_requests').select('id, status, rejection_reason, created_at, animals(id, name), ngos(name)')
      .eq('adopter_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('checkins').select('id, due_day, due_at, status, adoptions!inner(adopter_id, animals(name))')
      .eq('adoptions.adopter_id', user!.id).in('status', ['pending', 'late']).lte('due_at', new Date(Date.now() + 864e5).toISOString()),
  ]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      {!!checkins?.length && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold">Como está seu novo amigo?</h2>
          {checkins.map((c) => (
            <form key={c.id} action={answerCheckin.bind(null, c.id)} className="card flex flex-col gap-3 p-5">
              <strong>{c.adoptions?.animals?.name} · {c.due_day} dias de adoção</strong>
              <label className="flex flex-col gap-1.5">
                <span className="label">Como está a adaptação?</span>
                <select name="adaptacao" className="field" required>
                  <option value="ótima">Ótima</option><option value="boa">Boa</option><option value="difícil">Difícil</option>
                </select>
              </label>
              <textarea name="comentario" rows={2} placeholder="Conte como estão as coisas" className="field h-auto py-3" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="needs_help" className="h-5 w-5 accent-brand" /> Estou com dificuldade e quero ajuda da ONG</label>
              <button className="btn-primary self-start">Enviar</button>
            </form>
          ))}
        </section>
      )}

      <section>
        <h1 className="mb-4 text-2xl font-extrabold">Meus pedidos</h1>
        <div className="card divide-y divide-line">
          {(requests ?? []).map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex flex-col">
                <Link href={`/animais/${r.animals?.id}`} className="font-bold">{r.animals?.name}</Link>
                <span className="text-xs text-muted">{r.ngos?.name} · {new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
                {r.status === 'rejected' && r.rejection_reason && <span className="text-xs text-muted">Motivo: {r.rejection_reason}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-accent-soft px-2 py-1 text-xs font-bold text-accent-ink">{REQUEST_STATUS_LABEL[r.status]}</span>
                {['sent', 'reviewing', 'visit_scheduled'].includes(r.status) && (
                  <form action={cancel.bind(null, r.id)}><button className="btn-ghost min-h-9 px-3 text-xs">Cancelar</button></form>
                )}
              </div>
            </div>
          ))}
          {!requests?.length && <p className="p-8 text-center text-muted">Você ainda não fez nenhum pedido.</p>}
        </div>
      </section>
    </main>
  );
}
