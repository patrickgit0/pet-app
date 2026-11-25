import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { REQUEST_STATUS_LABEL, type RequestStatus, animalPath } from '@viralar/shared';
import { getSession } from '@/lib/supabase/server';
import { Badge, PageTitle, Pager, daysSince, fmtDate } from '../ui';

type SP = Promise<{ status?: string; page?: string }>;
const SIZE = 40;
const OPEN: RequestStatus[] = ['sent', 'reviewing', 'visit_scheduled'];
const TONE: Record<RequestStatus, 'good' | 'warn' | 'neutral' | 'bad'> = {
  sent: 'warn', reviewing: 'warn', visit_scheduled: 'good', approved: 'good', rejected: 'neutral', cancelled: 'neutral',
};

export default async function AdminRequests({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const { supabase } = await getSession();
  const { t, locale } = await getI18n();
  let query = supabase
    .from('adoption_requests')
    .select('id, status, created_at, updated_at, rejection_reason, adopter_id, animals(id, name, code), ngos(name, slug), profiles(full_name, neighborhood, city)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * SIZE, page * SIZE - 1);
  if (sp.status === 'abertos') query = query.in('status', OPEN);
  else if (sp.status === 'parado') query = query.eq('status', 'sent').lt('created_at', new Date(Date.now() - 48 * 3600_000).toISOString());
  else if (sp.status) query = query.eq('status', sp.status as RequestStatus);
  const { data: reqs, count } = await query;

  const tabs = [
    { v: '', label: t('Todos') }, { v: 'abertos', label: t('Em aberto') }, { v: 'parado', label: t('Parados +48 h') },
    { v: 'approved', label: t('Aprovados') }, { v: 'rejected', label: t('Recusados') }, { v: 'cancelled', label: t('Cancelados') },
  ];
  const href = (p: number) => `/admin/pedidos?${new URLSearchParams({ ...(sp.status && { status: sp.status }), page: String(p) })}`;

  return (
    <>
      <PageTitle title={t('Pedidos de adoção')} subtitle={t('{n} pedidos', { n: count ?? 0 })}>
        <a href="/api/admin/export/pedidos" download className="btn-ghost min-h-9 bg-white px-3 text-xs">{t('Exportar CSV')}</a>
      </PageTitle>
      <nav className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {tabs.map((x) => (
          <Link key={x.v} href={x.v ? `/admin/pedidos?status=${x.v}` : '/admin/pedidos'}
            className={`flex min-h-9 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold ${(sp.status ?? '') === x.v ? 'bg-ink text-white' : 'bg-white ring-1 ring-line'}`}>
            {x.label}
          </Link>
        ))}
      </nav>
      <ul className="card divide-y divide-line">
        {(reqs ?? []).map((r) => {
          const age = daysSince(r.created_at) ?? 0;
          const stale = r.status === 'sent' && age >= 2;
          return (
            <li key={r.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/usuarios/${r.adopter_id}`} className="font-bold underline decoration-line-2 underline-offset-2 hover:text-brand">{r.profiles?.full_name}</Link>
                  <span className="text-sm text-muted">{t('quer adotar')}</span>
                  <Link href={r.animals ? animalPath(r.animals) : '#'} className="font-bold hover:text-brand">{r.animals?.name}</Link>
                </div>
                <p className="text-xs text-muted">
                  <Link href={`/ongs/${r.ngos?.slug}`} className="hover:text-brand">{r.ngos?.name}</Link>
                  {r.profiles?.city && ` · ${t('adotante em {place}', { place: [r.profiles.neighborhood, r.profiles.city].filter(Boolean).join(', ') })}`}
                  {' · '}{t('enviado em {d}', { d: fmtDate(r.created_at, locale) })}
                  {r.rejection_reason && ` · ${t('motivo:')} ${r.rejection_reason}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/pedidos/${r.id}`} className="btn-ghost min-h-9 bg-white px-3 text-xs">{t('Ver histórico')}</Link>
                <Badge tone={TONE[r.status]}>{t(REQUEST_STATUS_LABEL[r.status])}</Badge>
                {stale && <Badge tone="bad">{t('{n} dias sem resposta', { n: age })}</Badge>}
              </div>
            </li>
          );
        })}
        {!reqs?.length && <li className="p-6 text-center text-sm text-muted">{t('Nenhum pedido aqui.')}</li>}
      </ul>
      <Pager page={page} total={count ?? 0} size={SIZE} href={href} />
    </>
  );
}
