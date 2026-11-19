import { ConfirmSubmit } from '@/components/confirm';
import { getI18n, pageTitle } from '@/i18n/server';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { REQUEST_STATUS_LABEL, animalPath } from '@adotai/shared';
import { createClient, getSession } from '@/lib/supabase/server';
import { CalendarIcon } from '@/components/icons';

export const generateMetadata = pageTitle('Meus pedidos');

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
  const { t, locale } = await getI18n();
  const [{ data: requests }, { data: checkins }, { data: convs }] = await Promise.all([
    supabase.from('adoption_requests').select('id, status, rejection_reason, created_at, animal_id, animals(id, name, code), ngos(name), adoptions(id)')
      .eq('adopter_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('checkins').select('id, due_day, due_at, status, adoptions!inner(adopter_id, animals(name))')
      .eq('adoptions.adopter_id', user!.id).in('status', ['pending', 'late']).lte('due_at', new Date(Date.now() + 864e5).toISOString()),
    // Última proposta de visita de cada conversa (para mostrar quando e onde é a visita)
    supabase.from('conversations').select('id, animal_id, messages(visit_at, visit_place, visit_confirmed_at, created_at)')
      .eq('adopter_id', user!.id).eq('messages.kind', 'visit_proposal')
      .order('created_at', { referencedTable: 'messages', ascending: false }).limit(1, { referencedTable: 'messages' }),
  ]);
  const visitByAnimal = new Map((convs ?? []).map((c) => [c.animal_id, { conv: c.id, visit: c.messages?.[0] }]));
  const fmtVisit = (iso: string) => new Date(iso).toLocaleString(locale, { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      {!!checkins?.length && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold">{t('Como está seu novo amigo?')}</h2>
          {checkins.map((c) => (
            <form key={c.id} action={answerCheckin.bind(null, c.id)} className="card flex flex-col gap-3 p-5">
              <strong>{c.adoptions?.animals?.name} · {t('{n} dias de adoção', { n: c.due_day })}</strong>
              <label className="flex flex-col gap-1.5">
                <span className="label">{t('Como está a adaptação?')}</span>
                <select name="adaptacao" className="field" required>
                  <option value="ótima">{t('Ótima')}</option><option value="boa">{t('Boa')}</option><option value="difícil">{t('Difícil')}</option>
                </select>
              </label>
              <textarea name="comentario" rows={2} placeholder={t('Conte como estão as coisas')} className="field h-auto py-3" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="needs_help" className="h-5 w-5 accent-brand" /> {t('Estou com dificuldade e quero ajuda da ONG')}</label>
              <ConfirmSubmit title="Enviar resposta do check-in?" message="A ONG vai ver sua resposta. Se marcou que está com dificuldade, ela entra em contato." confirmLabel="Enviar" className="btn-primary self-start">{t('Enviar')}</ConfirmSubmit>
            </form>
          ))}
        </section>
      )}

      <section>
        <h1 className="mb-4 text-2xl font-extrabold">{t('Meus pedidos')}</h1>
        <div className="card divide-y divide-line">
          {(requests ?? []).map((r) => {
            const adopted = Boolean(r.adoptions); // adoção é 1:1 com o pedido
            const v = visitByAnimal.get(r.animal_id);
            const showVisit = r.status === 'visit_scheduled' && v?.visit?.visit_at;
            return (
              <div key={r.id} className="flex flex-col gap-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col">
                    <Link href={r.animals ? animalPath(r.animals) : '#'} className="font-bold">{r.animals?.name ?? t('Animal')}</Link>
                    <span className="text-xs text-muted">{r.ngos?.name} · {t('pedido em {d}', { d: new Date(r.created_at).toLocaleDateString(locale) })}</span>
                    {r.status === 'rejected' && r.rejection_reason && <span className="text-xs text-muted">{t('Motivo:')} {r.rejection_reason}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-md px-2 py-1 text-xs font-bold ${adopted ? 'bg-brand-soft text-brand-dark' : 'bg-accent-soft text-accent-ink'}`}>
                      {adopted ? t('Adotado') : t(REQUEST_STATUS_LABEL[r.status])}
                    </span>
                    {['sent', 'reviewing', 'visit_scheduled'].includes(r.status) && (
                      <form action={cancel.bind(null, r.id)}><ConfirmSubmit title="Cancelar este pedido?" message="A ONG será avisada e o pedido não poderá ser retomado. Você pode fazer um novo pedido depois." confirmLabel="Cancelar pedido" tone="danger" className="btn-ghost min-h-9 px-3 text-xs">{t('Cancelar')}</ConfirmSubmit></form>
                    )}
                  </div>
                </div>
                {showVisit && (
                  <Link href={`/mensagens/${v!.conv}`} className="flex items-start gap-3 rounded-xl bg-brand-soft p-3 text-sm">
                    <CalendarIcon size={20} className="mt-0.5 shrink-0 text-brand" />
                    <span className="flex min-w-0 flex-col">
                      <strong className="first-letter:uppercase">{fmtVisit(v!.visit!.visit_at!)}</strong>
                      {v!.visit!.visit_place && <span className="text-ink-2">{v!.visit!.visit_place}</span>}
                      <span className="text-xs font-semibold text-brand-dark">{v!.visit!.visit_confirmed_at ? t('Visita confirmada') : t('Aguardando confirmação')} · {t('Abrir conversa')} →</span>
                    </span>
                  </Link>
                )}
              </div>
            );
          })}
          {!requests?.length && <p className="p-8 text-center text-muted">{t('Você ainda não fez nenhum pedido.')}</p>}
        </div>
      </section>
    </main>
  );
}
