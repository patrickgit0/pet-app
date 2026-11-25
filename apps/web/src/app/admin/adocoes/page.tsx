import { animalPath } from '@viralar/shared';
import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { getSession } from '@/lib/supabase/server';
import { Badge, PageTitle, fmtDate } from '../ui';

type SP = Promise<{ filtro?: string }>;

export default async function AdminAdoptions({ searchParams }: { searchParams: SP }) {
  const { filtro } = await searchParams;
  const { supabase } = await getSession();
  const { t, locale } = await getI18n();
  const { data } = await supabase
    .from('adoptions')
    .select('id, request_id, adopter_id, adopted_at, status, returned_at, return_reason, term_accepted_at, animals(id, name, code), ngos(name, slug), profiles(full_name), checkins(due_day, due_at, status, needs_help, ngo_followed_up_at)')
    .order('adopted_at', { ascending: false })
    .limit(300);

  const now = Date.now();
  const rows = (data ?? []).map((a) => {
    const late = a.checkins.filter((c) => c.status === 'late' || (c.status === 'pending' && new Date(c.due_at).getTime() < now));
    const help = a.checkins.some((c) => c.needs_help && !c.ngo_followed_up_at);
    return { ...a, late: late.length, help };
  });
  const list = filtro === 'ajuda' ? rows.filter((r) => r.help) : filtro === 'atrasado' ? rows.filter((r) => r.late > 0) : filtro === 'devolvido' ? rows.filter((r) => r.status === 'returned') : rows;

  const tabs = [{ v: '', label: t('Todas') }, { v: 'ajuda', label: t('Pediram ajuda') }, { v: 'atrasado', label: t('Check-in atrasado') }, { v: 'devolvido', label: t('Devolvidas') }];

  return (
    <>
      <PageTitle title={t('Adoções e pós-adoção')} subtitle={t('{n} adoções', { n: list.length })}>
        <a href="/api/admin/export/adocoes" download className="btn-ghost min-h-9 bg-white px-3 text-xs">{t('Exportar CSV')}</a>
      </PageTitle>
      <nav className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {tabs.map((x) => (
          <Link key={x.v} href={x.v ? `/admin/adocoes?filtro=${x.v}` : '/admin/adocoes'}
            className={`flex min-h-9 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold ${(filtro ?? '') === x.v ? 'bg-ink text-white' : 'bg-white ring-1 ring-line'}`}>
            {x.label}
          </Link>
        ))}
      </nav>
      <ul className="card divide-y divide-line">
        {list.map((a) => (
          <li key={a.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <p>
                <Link href={a.animals ? animalPath(a.animals) : '#'} className="font-bold hover:text-brand">{a.animals?.name}</Link>
                <span className="text-sm text-muted"> {t('com')} </span><Link href={`/admin/usuarios/${a.adopter_id}`} className="text-sm font-semibold underline decoration-line-2 underline-offset-2 hover:text-brand">{a.profiles?.full_name}</Link>
              </p>
              <p className="text-xs text-muted">
                <Link href={`/ongs/${a.ngos?.slug}`} className="hover:text-brand">{a.ngos?.name}</Link> · {t('adotado em {d}', { d: fmtDate(a.adopted_at, locale) })}
                {!a.term_accepted_at && ` · ${t('termo ainda não aceito')}`}
                {a.return_reason && ` · ${t('devolução:')} ${a.return_reason}`}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {a.checkins.sort((x, y) => x.due_day - y.due_day).map((c) => {
                  const isLate = c.status === 'late' || (c.status === 'pending' && new Date(c.due_at).getTime() < now);
                  return (
                    <Badge key={c.due_day} tone={c.status === 'answered' ? 'good' : isLate ? 'bad' : 'neutral'}>
                      {t('{n} dias', { n: c.due_day })}: {c.status === 'answered' ? t('respondido') : isLate ? t('atrasado') : t('pendente')}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/admin/pedidos/${a.request_id}`} className="btn-ghost min-h-9 bg-white px-3 text-xs">{t('Ver histórico')}</Link>
              {a.status === 'returned' && <Badge tone="bad">{t('Devolvido')}</Badge>}
              {a.help && <Badge tone="bad">{t('Pediu ajuda')}</Badge>}
            </div>
          </li>
        ))}
        {!list.length && <li className="p-6 text-center text-sm text-muted">{t('Nenhuma adoção aqui.')}</li>}
      </ul>
    </>
  );
}
