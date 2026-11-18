import Link from 'next/link';
import { REQUEST_STATUS_LABEL, type RequestStatus } from '@adotai/shared';
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
  let query = supabase
    .from('adoption_requests')
    .select('id, status, created_at, updated_at, rejection_reason, animals(id, name), ngos(name, slug), profiles(full_name, neighborhood, city)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * SIZE, page * SIZE - 1);
  if (sp.status === 'abertos') query = query.in('status', OPEN);
  else if (sp.status === 'parado') query = query.eq('status', 'sent').lt('created_at', new Date(Date.now() - 48 * 3600_000).toISOString());
  else if (sp.status) query = query.eq('status', sp.status as RequestStatus);
  const { data: reqs, count } = await query;

  const tabs = [
    { v: '', label: 'Todos' }, { v: 'abertos', label: 'Em aberto' }, { v: 'parado', label: 'Parados +48 h' },
    { v: 'approved', label: 'Aprovados' }, { v: 'rejected', label: 'Recusados' }, { v: 'cancelled', label: 'Cancelados' },
  ];
  const href = (p: number) => `/admin/pedidos?${new URLSearchParams({ ...(sp.status && { status: sp.status }), page: String(p) })}`;

  return (
    <>
      <PageTitle title="Pedidos de adoção" subtitle={`${count ?? 0} pedidos`} />
      <nav className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {tabs.map((t) => (
          <Link key={t.v} href={t.v ? `/admin/pedidos?status=${t.v}` : '/admin/pedidos'}
            className={`flex min-h-9 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold ${(sp.status ?? '') === t.v ? 'bg-ink text-white' : 'bg-white ring-1 ring-line'}`}>
            {t.label}
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
                  <strong>{r.profiles?.full_name}</strong>
                  <span className="text-sm text-muted">quer adotar</span>
                  <Link href={`/animais/${r.animals?.id}`} className="font-bold hover:text-brand">{r.animals?.name}</Link>
                </div>
                <p className="text-xs text-muted">
                  <Link href={`/ongs/${r.ngos?.slug}`} className="hover:text-brand">{r.ngos?.name}</Link>
                  {r.profiles?.city && ` · adotante em ${[r.profiles.neighborhood, r.profiles.city].filter(Boolean).join(', ')}`}
                  {' · '}enviado em {fmtDate(r.created_at)}
                  {r.rejection_reason && ` · motivo: ${r.rejection_reason}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge tone={TONE[r.status]}>{REQUEST_STATUS_LABEL[r.status]}</Badge>
                {stale && <Badge tone="bad">{age} dias sem resposta</Badge>}
              </div>
            </li>
          );
        })}
        {!reqs?.length && <li className="p-6 text-center text-sm text-muted">Nenhum pedido aqui.</li>}
      </ul>
      <Pager page={page} total={count ?? 0} size={SIZE} href={href} />
    </>
  );
}
