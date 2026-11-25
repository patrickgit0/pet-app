import { ConfirmSubmit } from '@/components/confirm';
import { getI18n, pageTitle } from '@/i18n/server';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { REQUEST_STATUS_LABEL, animalPath, type RequestStatus } from '@viralar/shared';
import { createClient, getSession } from '@/lib/supabase/server';
import { CalendarIcon } from '@/components/icons';
import { photoUrl, tintFor } from '@/lib/utils';
import { CheckinForm } from './checkin-form';

export const generateMetadata = pageTitle('Meus pedidos');

async function cancel(id: string) {
  'use server';
  const supabase = await createClient();
  await supabase.rpc('cancel_adoption_request', { p_request_id: id });
  revalidatePath('/meus-pedidos');
}

async function acceptTerm(adoptionId: string) {
  'use server';
  const supabase = await createClient();
  await supabase.rpc('accept_adoption_term', { p_adoption_id: adoptionId });
  revalidatePath('/meus-pedidos');
}

async function review(adoptionId: string, formData: FormData) {
  'use server';
  const stars = Number(formData.get('stars'));
  if (!(stars >= 1 && stars <= 5)) return;
  const supabase = await createClient();
  await supabase.rpc('review_ngo', { p_adoption_id: adoptionId, p_stars: stars, p_comment: String(formData.get('comment') ?? '').slice(0, 2000) });
  revalidatePath('/meus-pedidos');
}

const STEPS = ['sent', 'reviewing', 'visit_scheduled', 'approved', 'adopted'] as const;
const STEP_LABEL: Record<(typeof STEPS)[number], string> = {
  sent: 'Enviado', reviewing: 'Em análise', visit_scheduled: 'Visita', approved: 'Aprovado', adopted: 'Adotado',
};
const NEXT: Partial<Record<RequestStatus | 'adopted', string>> = {
  sent: 'A ONG vai analisar seu perfil. Você recebe um aviso quando ela responder.',
  reviewing: 'A ONG está analisando seu pedido. Ela pode propor uma visita pela conversa.',
  visit_scheduled: 'Confirme a visita na conversa e vá conhecer o animal.',
  approved: 'Pedido aprovado! Combine a entrega com a ONG pela conversa. Ela registra a adoção no Vira Lar.',
  rejected: 'Este pedido não seguiu. Há outros animais esperando por você.',
  cancelled: 'Você cancelou este pedido.',
};
const EVENT: Record<RequestStatus, string> = {
  sent: 'Pedido enviado', reviewing: 'ONG começou a analisar', visit_scheduled: 'Visita marcada',
  approved: 'Pedido aprovado', rejected: 'Pedido recusado', cancelled: 'Pedido cancelado',
};

export default async function Page() {
  const { supabase, user } = await getSession();
  const { t, locale } = await getI18n();
  const [{ data: requests }, { data: checkins }, { data: convs }, { data: adoptions }] = await Promise.all([
    supabase.from('adoption_requests')
      .select('id, status, rejection_reason, created_at, animal_id, animals(id, name, code, species, size), ngos(name), adoption_request_events(status, created_at)')
      .eq('adopter_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('checkins').select('id, due_day, due_at, status, adoption_id, adoptions!inner(adopter_id, status, animals(name))')
      .eq('adoptions.adopter_id', user!.id).eq('adoptions.status', 'active').in('status', ['pending', 'late'])
      .lte('due_at', new Date(Date.now() + 864e5).toISOString()),
    // Última proposta de visita de cada conversa (para mostrar quando e onde é a visita)
    supabase.from('conversations').select('id, animal_id, messages(visit_at, visit_place, visit_confirmed_at, created_at)')
      .eq('adopter_id', user!.id).eq('messages.kind', 'visit_proposal')
      .order('created_at', { referencedTable: 'messages', ascending: false }).limit(1, { referencedTable: 'messages' }),
    supabase.from('adoptions').select('id, request_id, adopted_at, term_accepted_at, status, returned_at, reviews(stars), checkins(due_day, due_at, answered_at)')
      .eq('adopter_id', user!.id),
  ]);
  // Recusados nos últimos 60 dias: sugere animais parecidos (mesma espécie, de preferência mesmo porte)
  const rejected = (requests ?? []).filter((r) => r.status === 'rejected' && r.animals && Date.now() - new Date(r.created_at).getTime() < 60 * 864e5);
  const { data: pool } = rejected.length
    ? await supabase.from('animals').select('id, name, code, species, size, animal_photos(storage_path, position)')
      .eq('status', 'available').in('species', [...new Set(rejected.map((r) => r.animals!.species))]).order('published_at', { ascending: false }).limit(40)
    : { data: [] };
  const similarFor = (r: (typeof rejected)[number]) => (pool ?? [])
    .filter((x) => x.species === r.animals!.species && x.id !== r.animals!.id)
    .sort((x, y) => Number(y.size === r.animals!.size) - Number(x.size === r.animals!.size))
    .slice(0, 3);
  const visitByAnimal = new Map((convs ?? []).map((c) => [c.animal_id, { conv: c.id, visit: c.messages?.[0] }]));
  const adoptionByRequest = new Map((adoptions ?? []).map((a) => [a.request_id, a]));
  const fmtVisit = (iso: string) => new Date(iso).toLocaleString(locale, { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { timeZone: 'America/Sao_Paulo' });
  const fmtDT = (iso: string) => new Date(iso).toLocaleString(locale, { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      {!!checkins?.length && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold">{t('Como está seu novo amigo?')}</h2>
          {checkins.map((c) => (
            <CheckinForm key={c.id} checkinId={c.id} adoptionId={c.adoption_id} userId={user!.id}
              title={`${c.adoptions?.animals?.name} · ${t('{n} dias de adoção', { n: c.due_day })}`} />
          ))}
        </section>
      )}

      <section>
        <h1 className="mb-4 text-2xl font-extrabold">{t('Meus pedidos')}</h1>
        <div className="flex flex-col gap-3">
          {(requests ?? []).map((r) => {
            const adoption = adoptionByRequest.get(r.id);
            const adopted = Boolean(adoption) && adoption!.status === 'active';
            const returned = adoption?.status === 'returned';
            const v = visitByAnimal.get(r.animal_id);
            const showVisit = r.status === 'visit_scheduled' && v?.visit?.visit_at;
            const stage = adopted ? 'adopted' : r.status;
            const stepIdx = STEPS.indexOf(stage as (typeof STEPS)[number]);
            const open = ['sent', 'reviewing', 'visit_scheduled'].includes(r.status);
            const events = [...(r.adoption_request_events ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
            const checkin30 = adoption?.checkins.find((c) => c.due_day === 30);
            const canReview = adopted && !adoption!.reviews
              && (Boolean(checkin30?.answered_at) || new Date(adoption!.adopted_at).getTime() < Date.now() - 30 * 864e5);
            const nextCheckin = adoption?.checkins.filter((c) => !c.answered_at).sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
            return (
              <article key={r.id} className="card flex flex-col gap-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col">
                    <Link href={r.animals ? animalPath(r.animals) : '#'} className="font-bold">{r.animals?.name ?? t('Animal')}</Link>
                    <span className="text-xs text-muted">{r.ngos?.name} · {t('pedido em {d}', { d: fmtDate(r.created_at) })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-md px-2 py-1 text-xs font-bold ${adopted ? 'bg-brand-soft text-brand-dark' : returned || ['rejected', 'cancelled'].includes(r.status) ? 'bg-ground text-muted' : 'bg-accent-soft text-accent-ink'}`}>
                      {returned ? t('Devolvido') : adopted ? t('Adotado') : t(REQUEST_STATUS_LABEL[r.status])}
                    </span>
                    {open && (
                      <form action={cancel.bind(null, r.id)}><ConfirmSubmit title="Cancelar este pedido?" message="A ONG será avisada e o pedido não poderá ser retomado. Você pode fazer um novo pedido depois." confirmLabel="Cancelar pedido" tone="danger" className="btn-ghost min-h-9 px-3 text-xs">{t('Cancelar')}</ConfirmSubmit></form>
                    )}
                  </div>
                </div>

                {stepIdx >= 0 && !returned && (
                  <ol className="flex items-center gap-1" aria-label={t('Etapas do pedido')}>
                    {STEPS.map((s, i) => (
                      <li key={s} className="flex flex-1 flex-col gap-1">
                        <span className={`h-1.5 rounded-full ${i <= stepIdx ? 'bg-brand' : 'bg-line'}`} />
                        <span className={`text-[11px] ${i === stepIdx ? 'font-bold text-ink' : 'text-muted'}`}>{t(STEP_LABEL[s])}</span>
                      </li>
                    ))}
                  </ol>
                )}

                {!adopted && !returned && NEXT[r.status] && (
                  <p className="text-sm text-ink-2">
                    {t(NEXT[r.status]!)}
                    {r.status === 'rejected' && r.rejection_reason && <span className="block text-xs text-muted">{t('Motivo:')} {r.rejection_reason}</span>}
                    {r.status === 'rejected' && r.animals && (
                      <Link href={`/?especie=${r.animals.species}`} className="mt-1 block font-semibold text-brand">{t('Ver animais parecidos →')}</Link>
                    )}
                  </p>
                )}
                {r.status === 'rejected' && rejected.includes(r) && similarFor(r).length > 0 && (
                  <ul className="grid grid-cols-3 gap-2">
                    {similarFor(r).map((x) => {
                      const cover = [...x.animal_photos].sort((p1, p2) => p1.position - p2.position)[0]?.storage_path;
                      return (
                        <li key={x.id}>
                          <Link href={animalPath(x)} className="flex flex-col gap-1 text-xs font-bold">
                            <span className="aspect-square overflow-hidden rounded-xl" style={{ background: tintFor(x.name) }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              {cover && <img src={photoUrl(cover)!} alt="" className="h-full w-full object-cover" />}
                            </span>
                            {x.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}

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
                {v && !showVisit && (open || r.status === 'approved' || adopted) && (
                  <Link href={`/mensagens/${v.conv}`} className="text-sm font-semibold text-brand">{t('Abrir conversa')} →</Link>
                )}

                {adopted && (
                  <div className="flex flex-col gap-2">
                    {!adoption!.term_accepted_at ? (
                      <form action={acceptTerm.bind(null, adoption!.id)} className="flex flex-col gap-2 rounded-xl bg-accent-soft p-3 text-sm">
                        <strong className="text-accent-ink">{t('Falta aceitar o termo de adoção')}</strong>
                        <span className="text-ink-2">{t('É o compromisso de cuidar bem de {name}. Leia antes de aceitar.', { name: r.animals?.name ?? '' })}</span>
                        <div className="flex flex-wrap gap-2">
                          <Link href="/termo-de-adocao" target="_blank" className="btn-ghost min-h-10 bg-white px-3 text-sm">{t('Ler o termo')}</Link>
                          <ConfirmSubmit title="Aceitar o termo de adoção?" message="Você confirma que leu e se compromete com o termo. A ONG recebe o aviso e fica registrado com data e hora." confirmLabel="Li e aceito" className="btn-primary min-h-10 px-3 text-sm">{t('Li e aceito')}</ConfirmSubmit>
                        </div>
                      </form>
                    ) : (
                      <p className="text-sm text-ink-2">
                        {t('Termo aceito em {d}', { d: fmtDT(adoption!.term_accepted_at) })} ·{' '}
                        <Link href={`/meus-pedidos/termo/${adoption!.id}`} className="font-semibold text-brand">{t('Baixar cópia (PDF)')}</Link>
                      </p>
                    )}
                    {nextCheckin && <p className="text-xs text-muted">{t('Próximo check-in: {d}', { d: fmtDate(nextCheckin.due_at) })}</p>}
                    {adoption!.reviews && <p className="text-sm text-ink-2">{t('Você avaliou a ONG: {s} de 5', { s: adoption!.reviews.stars })}</p>}
                    {canReview && (
                      <form action={review.bind(null, adoption!.id)} className="flex flex-col gap-2 rounded-xl bg-ground p-3">
                        <strong className="text-sm">{t('Como foi adotar com a {ngo}?', { ngo: r.ngos?.name ?? 'ONG' })}</strong>
                        <fieldset className="flex gap-1" aria-label={t('Nota de 1 a 5')}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <label key={n} className="cursor-pointer">
                              <input type="radio" name="stars" value={n} required className="peer sr-only" />
                              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white text-lg font-bold peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand">{n}</span>
                            </label>
                          ))}
                        </fieldset>
                        <textarea name="comment" rows={2} maxLength={2000} placeholder={t('Conte como foi (opcional, aparece na página da ONG)')} className="field h-auto py-3" />
                        <ConfirmSubmit title="Enviar avaliação?" message="A avaliação aparece na página da ONG e não pode ser alterada depois." confirmLabel="Enviar avaliação" className="btn-primary self-start">{t('Enviar avaliação')}</ConfirmSubmit>
                      </form>
                    )}
                  </div>
                )}

                {events.length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-xs font-semibold text-muted">{t('Ver histórico')}</summary>
                    <ol className="mt-2 flex flex-col gap-1.5 border-l-2 border-line pl-3">
                      {events.map((e, i) => (
                        <li key={i}><span className="font-semibold">{t(EVENT[e.status])}</span> <span className="text-xs text-muted">· {fmtDT(e.created_at)}</span></li>
                      ))}
                      {adoption && <li><span className="font-semibold">{t('Adoção confirmada')}</span> <span className="text-xs text-muted">· {fmtDT(adoption.adopted_at)}</span></li>}
                      {adoption?.term_accepted_at && <li><span className="font-semibold">{t('Termo de adoção aceito')}</span> <span className="text-xs text-muted">· {fmtDT(adoption.term_accepted_at)}</span></li>}
                      {adoption?.returned_at && <li><span className="font-semibold">{t('Animal devolvido')}</span> <span className="text-xs text-muted">· {fmtDT(adoption.returned_at)}</span></li>}
                    </ol>
                  </details>
                )}
              </article>
            );
          })}
          {!requests?.length && <p className="card p-8 text-center text-muted">{t('Você ainda não fez nenhum pedido.')}</p>}
        </div>
      </section>
    </main>
  );
}
