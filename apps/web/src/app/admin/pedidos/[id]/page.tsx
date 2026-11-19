import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { REQUEST_STATUS_LABEL, animalPath, type RequestStatus } from '@adotai/shared';
import { getSession } from '@/lib/supabase/server';
import { photoUrl, tintFor } from '@/lib/utils';
import { BackIcon, PawIcon } from '@/components/icons';
import { Badge, fmtDate } from '../../ui';

const TONE: Record<RequestStatus, 'good' | 'warn' | 'neutral' | 'bad'> = {
  sent: 'warn', reviewing: 'warn', visit_scheduled: 'good', approved: 'good', rejected: 'neutral', cancelled: 'neutral',
};
const EVENT: Record<RequestStatus, string> = {
  sent: 'Pedido enviado', reviewing: 'ONG começou a analisar', visit_scheduled: 'Visita marcada',
  approved: 'Pedido aprovado', rejected: 'Pedido recusado', cancelled: 'Pedido cancelado',
};

type Item = { at: string; title: string; detail?: string | null; tone: 'good' | 'warn' | 'neutral' | 'bad' };

/** Histórico completo de um pedido (e da adoção, se houve): status, visitas, check-ins, avaliação. */
export default async function AdminRequest({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await getSession();
  const { t, locale } = await getI18n();
  const { data: r } = await supabase.from('adoption_requests')
    .select('id, status, created_at, updated_at, rejection_reason, animal_id, adopter_id, ngo_id, animals(id, name, code, status, animal_photos(storage_path, position)), ngos(name, slug), profiles(full_name, neighborhood, city)')
    .eq('id', id).maybeSingle();
  if (!r) notFound();

  const [{ data: events }, { data: conv }, { data: adoption }] = await Promise.all([
    supabase.from('adoption_request_events').select('id, status, note, created_at, profiles(full_name)').eq('request_id', id).order('created_at'),
    supabase.from('conversations').select('id, created_at, messages(kind, sender_id, visit_at, visit_place, visit_confirmed_at, created_at)')
      .eq('animal_id', r.animal_id).eq('adopter_id', r.adopter_id).maybeSingle(),
    supabase.from('adoptions').select('id, adopted_at, term_accepted_at, status, returned_at, return_reason, checkins(id, due_day, due_at, status, answers, answered_at, needs_help, ngo_followed_up_at), reviews(stars, comment, created_at)')
      .eq('request_id', id).maybeSingle(),
  ]);

  const dt = (d: string) => new Date(d).toLocaleString(locale, { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
  const msgs = conv?.messages ?? [];
  const items: Item[] = [];
  for (const e of events ?? []) {
    items.push({
      at: e.created_at, title: t(EVENT[e.status]), tone: TONE[e.status],
      detail: [e.profiles?.full_name && t('por {name}', { name: e.profiles.full_name }), e.note && t('motivo: {r}', { r: e.note })].filter(Boolean).join(' · ') || null,
    });
  }
  if (conv) items.push({ at: conv.created_at, title: t('Conversa iniciada'), tone: 'neutral', detail: t('{n} mensagens', { n: msgs.length }) });
  for (const m of msgs.filter((x) => x.kind === 'visit_proposal' && x.visit_at)) {
    items.push({ at: m.created_at, title: t('ONG propôs visita para {d}', { d: dt(m.visit_at!) }), tone: 'neutral', detail: m.visit_place });
    if (m.visit_confirmed_at) items.push({ at: m.visit_confirmed_at, title: t('Adotante confirmou a visita'), tone: 'good' });
  }
  if (adoption) {
    items.push({ at: adoption.adopted_at, title: t('Adoção confirmada'), tone: 'good' });
    if (adoption.term_accepted_at) items.push({ at: adoption.term_accepted_at, title: t('Termo de adoção aceito'), tone: 'good' });
    for (const c of adoption.checkins) {
      if (c.answered_at) {
        const a = (c.answers ?? {}) as { adaptacao?: string; comentario?: string };
        items.push({ at: c.answered_at, title: t('Check-in de {n} dias respondido', { n: c.due_day }), tone: c.needs_help ? 'bad' : 'good',
          detail: [a.adaptacao, a.comentario, c.needs_help && t('pediu ajuda')].filter(Boolean).join(' · ') || null });
      } else if (new Date(c.due_at) < new Date()) {
        items.push({ at: c.due_at, title: t('Check-in de {n} dias atrasado', { n: c.due_day }), tone: 'bad' });
      }
      if (c.ngo_followed_up_at) items.push({ at: c.ngo_followed_up_at, title: t('ONG acompanhou o pedido de ajuda'), tone: 'good' });
    }
    const rv = adoption.reviews;
    if (rv) items.push({ at: rv.created_at, title: t('Avaliou a ONG: {s} de 5', { s: rv.stars }), tone: 'good', detail: rv.comment });
    if (adoption.returned_at) items.push({ at: adoption.returned_at, title: t('Animal devolvido'), tone: 'bad', detail: adoption.return_reason });
  }
  items.sort((a, b) => a.at.localeCompare(b.at));
  const upcoming = (adoption?.checkins ?? []).filter((c) => !c.answered_at && new Date(c.due_at) >= new Date()).sort((a, b) => a.due_day - b.due_day);
  const cover = [...(r.animals?.animal_photos ?? [])].sort((a, b) => a.position - b.position)[0]?.storage_path;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href={adoption ? '/admin/adocoes' : '/admin/pedidos'} aria-label={t('Voltar')} className="btn-ghost h-11 w-11 rounded-full p-0"><BackIcon /></Link>
        <h1 className="text-xl font-extrabold sm:text-2xl">{adoption ? t('Adoção') : t('Pedido de adoção')}</h1>
        <Badge tone={TONE[r.status]}>{t(REQUEST_STATUS_LABEL[r.status])}</Badge>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href={`/admin/usuarios/${r.adopter_id}`} className="card flex items-center gap-3 p-4 hover:ring-brand">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft font-extrabold text-brand-dark">
            {(r.profiles?.full_name ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block text-xs text-muted">{t('Adotante')}</span>
            <strong className="block truncate">{r.profiles?.full_name}</strong>
            <span className="block text-xs text-muted">{[r.profiles?.neighborhood, r.profiles?.city].filter(Boolean).join(', ')}</span>
            <span className="text-xs font-semibold text-brand">{t('Ver ficha completa →')}</span>
          </span>
        </Link>
        <div className="card flex items-center gap-3 p-4">
          <Link href={r.animals ? animalPath(r.animals) : '#'} className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl" style={{ background: tintFor(r.animals?.name ?? '') }}>
            {cover
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={photoUrl(cover)!} alt="" className="h-full w-full object-cover" />
              : <PawIcon size={20} className="text-ink/30" />}
          </Link>
          <span className="min-w-0">
            <span className="block text-xs text-muted">{t('Animal e ONG')}</span>
            <Link href={r.animals ? animalPath(r.animals) : '#'} className="block truncate font-bold hover:text-brand">{r.animals?.name}</Link>
            <Link href={`/ongs/${r.ngos?.slug}`} className="block truncate text-xs text-muted hover:text-brand">{r.ngos?.name}</Link>
          </span>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold">{t('Histórico')}</h2>
          {conv && <Link href={`/mensagens/${conv.id}`} className="btn-ghost min-h-9 bg-white px-3 text-xs">{t('Abrir conversa (só leitura)')}</Link>}
        </div>
        <ol className="relative flex flex-col gap-4 border-l-2 border-line pl-5">
          {items.map((it, i) => (
            <li key={i} className="relative">
              <span className={`absolute top-1 -left-[27px] h-3 w-3 rounded-full ring-4 ring-white ${it.tone === 'good' ? 'bg-brand' : it.tone === 'bad' ? 'bg-red-600' : it.tone === 'warn' ? 'bg-accent' : 'bg-line-2'}`} aria-hidden />
              <p className="text-sm font-bold">{it.title}</p>
              <p className="text-xs text-muted">{dt(it.at)}{it.detail ? ` · ${it.detail}` : ''}</p>
            </li>
          ))}
          {upcoming.map((c) => (
            <li key={c.id} className="relative opacity-60">
              <span className="absolute top-1 -left-[27px] h-3 w-3 rounded-full border-2 border-line-2 bg-white ring-4 ring-white" aria-hidden />
              <p className="text-sm font-bold">{t('Check-in de {n} dias', { n: c.due_day })}</p>
              <p className="text-xs text-muted">{t('previsto para {d}', { d: fmtDate(c.due_at, locale) })}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
