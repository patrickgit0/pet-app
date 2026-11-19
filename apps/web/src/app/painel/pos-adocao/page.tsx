import { ConfirmSubmit } from '@/components/confirm';
import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMyNgo } from '@/lib/ngo';

const PILL = 'inline-flex min-h-10 items-center rounded-full border px-3 font-semibold';
const PILL_ON = 'border-brand bg-brand text-white';
const PILL_OFF = 'border-line bg-white text-ink';
const STATUS: Record<string, string> = { pending: 'Aguardando', answered: 'Respondido', late: 'Atrasado' };

async function markFollowedUp(checkinId: string) {
  'use server';
  const supabase = await createClient();
  await supabase.rpc('mark_checkin_followed_up', { p_checkin_id: checkinId });
  revalidatePath('/painel/pos-adocao');
}

async function registerReturn(adoptionId: string, formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { error } = await supabase.rpc('register_return', {
    p_adoption_id: adoptionId,
    p_reason: String(formData.get('reason') ?? '').slice(0, 1000),
    p_relist: formData.get('relist') === 'on',
  });
  if (error) redirect(`/painel/pos-adocao?erro=1`);
  revalidatePath('/painel/pos-adocao');
}

export default async function Page({ searchParams }: { searchParams: Promise<{ nova?: string; erro?: string; ver?: string }> }) {
  const { nova, erro, ver } = await searchParams;
  const { supabase, ngo } = await getMyNgo();
  const { t, locale } = await getI18n();
  const { data: all } = await supabase
    .from('adoptions')
    .select('id, adopted_at, status, returned_at, return_reason, term_accepted_at, animals(name), profiles!adoptions_adopter_id_fkey(full_name), reviews(stars, comment), checkins(id, due_day, due_at, status, needs_help, answers, answered_at, ngo_followed_up_at, photo_paths)')
    .eq('ngo_id', ngo!.id).order('adopted_at', { ascending: false });
  const fmt = (d: string) => new Date(d).toLocaleDateString(locale, { timeZone: 'America/Sao_Paulo' });

  const needsAction = (a: NonNullable<typeof all>[number]) =>
    a.status === 'active' && a.checkins.some((c) => (c.status === 'late' || c.needs_help) && !c.ngo_followed_up_at);
  const adoptions = (all ?? []).filter((a) => ver !== 'atencao' || needsAction(a));
  const attention = (all ?? []).filter(needsAction).length;

  // Fotos dos check-ins (bucket privado): links assinados por 1 hora
  const photoPaths = adoptions.flatMap((a) => a.checkins.flatMap((c) => c.photo_paths ?? []));
  const signed = new Map<string, string>();
  if (photoPaths.length) {
    const { data } = await supabase.storage.from('checkin-photos').createSignedUrls(photoPaths, 3600);
    for (const s of data ?? []) if (s.path && s.signedUrl) signed.set(s.path, s.signedUrl);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold">{t('Pós-adoção')}</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/painel/pos-adocao" className={`${PILL} ${ver !== 'atencao' ? PILL_ON : PILL_OFF}`}>{t('Todas')}</Link>
          <Link href="/painel/pos-adocao?ver=atencao" className={`${PILL} ${ver === 'atencao' ? PILL_ON : PILL_OFF}`}>{t('Precisam de atenção ({n})', { n: attention })}</Link>
        </div>
      </div>
      {nova && <p role="status" className="rounded-xl bg-brand-soft p-3 text-sm font-semibold text-brand-dark">{t('Adoção registrada! Check-ins de 7, 30, 90 e 180 dias foram agendados.')}</p>}
      {erro && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{t('Não foi possível registrar a devolução. Escreva o motivo.')}</p>}
      {adoptions.map((a) => (
        <section key={a.id} className="card flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-extrabold">{a.animals?.name} · {a.profiles?.full_name}</h2>
            <span className="text-xs text-muted">{t('Adotado em {d}', { d: fmt(a.adopted_at) })}{a.status === 'returned' ? ` · ${t('Devolvido')}` : ''}</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {a.term_accepted_at
              ? <Link href={`/meus-pedidos/termo/${a.id}`} className="rounded-md bg-brand-soft px-2 py-1 font-bold text-brand-dark">{t('Termo aceito em {d}', { d: fmt(a.term_accepted_at) })} →</Link>
              : <span className="rounded-md bg-accent-soft px-2 py-1 font-bold text-accent-ink">{t('Termo ainda não aceito pelo adotante')}</span>}
            {a.reviews && <span className="rounded-md bg-ground px-2 py-1 font-bold">{t('Avaliação: {s} de 5', { s: a.reviews.stars })}</span>}
          </div>
          {a.reviews?.comment && <p className="rounded-xl bg-ground p-3 text-sm italic">“{a.reviews.comment}”</p>}
          {a.status === 'returned' && a.return_reason && (
            <p className="text-sm text-muted">{t('Devolvido em {d}', { d: fmt(a.returned_at!) })} · {t('motivo: {r}', { r: a.return_reason })}</p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {[...(a.checkins ?? [])].sort((x, y) => x.due_day - y.due_day).map((c) => {
              const alert = (c.status === 'late' || c.needs_help) && !c.ngo_followed_up_at;
              return (
                <div key={c.id} className={`flex flex-col gap-1 rounded-xl p-3 text-sm ${alert ? 'bg-accent-soft' : 'bg-ground'}`}>
                  <span className="font-bold">{t('Check-in de {n} dias', { n: c.due_day })} · {t(STATUS[c.status])}</span>
                  <span className="text-xs text-muted">{t('Previsto para {d}', { d: fmt(c.due_at) })}</span>
                  {c.needs_help && <span className="text-xs font-bold text-accent-ink">{t('Adotante pediu ajuda')}</span>}
                  {c.answers && <span className="text-xs">{Object.entries(c.answers as Record<string, string>).filter(([, v]) => v).map(([k, v]) => `${t(k === 'adaptacao' ? 'Adaptação' : 'Comentário')}: ${v}`).join(' · ')}</span>}
                  {!!c.photo_paths?.length && (
                    <div className="mt-1 flex gap-1.5">
                      {c.photo_paths.map((p) => signed.get(p) && (
                        <a key={p} href={signed.get(p)} target="_blank" rel="noreferrer" className="h-16 w-16 overflow-hidden rounded-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={signed.get(p)} alt={t('Foto do check-in')} className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                  {alert && (
                    <form action={markFollowedUp.bind(null, c.id)}>
                      <ConfirmSubmit title="Marcar como acompanhado?" message="Use depois de falar com o adotante. O alerta some do painel." confirmLabel="Marcar como acompanhado" className="btn-ghost mt-1 min-h-9 px-3 text-xs">{t('Marcar como acompanhado')}</ConfirmSubmit>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
          {a.status === 'active' && (
            <details className="text-sm">
              <summary className="cursor-pointer text-xs font-semibold text-muted">{t('Registrar devolução')}</summary>
              <form action={registerReturn.bind(null, a.id)} className="mt-2 flex flex-col gap-2 rounded-xl bg-ground p-3">
                <textarea name="reason" required minLength={3} maxLength={1000} rows={2} placeholder={t('Motivo da devolução (o adotante não vê)')} className="field h-auto py-3" />
                <label className="flex items-center gap-2"><input type="checkbox" name="relist" className="h-5 w-5 accent-brand" /> {t('Colocar {name} para adoção de novo agora', { name: a.animals?.name ?? '' })}</label>
                <span className="text-xs text-muted">{t('Sem marcar, o anúncio volta como rascunho para você revisar. Os check-ins pendentes são cancelados.')}</span>
                <ConfirmSubmit title="Registrar a devolução?" message="A adoção fica marcada como devolvida e entra no cálculo da nota. Não dá para desfazer." confirmLabel="Registrar devolução" tone="danger" className="btn-ghost self-start bg-white">{t('Registrar devolução')}</ConfirmSubmit>
              </form>
            </details>
          )}
        </section>
      ))}
      {!adoptions.length && <p className="card p-8 text-center text-muted">{ver === 'atencao' ? t('Nada precisando de atenção agora.') : t('Nenhuma adoção registrada ainda.')}</p>}
    </div>
  );
}
