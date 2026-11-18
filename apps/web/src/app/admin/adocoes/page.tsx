import Link from 'next/link';
import { getSession } from '@/lib/supabase/server';
import { Badge, PageTitle, fmtDate } from '../ui';

type SP = Promise<{ filtro?: string }>;

export default async function AdminAdoptions({ searchParams }: { searchParams: SP }) {
  const { filtro } = await searchParams;
  const { supabase } = await getSession();
  const { data } = await supabase
    .from('adoptions')
    .select('id, adopted_at, status, returned_at, return_reason, term_accepted_at, animals(id, name), ngos(name, slug), profiles(full_name), checkins(due_day, due_at, status, needs_help, ngo_followed_up_at)')
    .order('adopted_at', { ascending: false })
    .limit(300);

  const now = Date.now();
  const rows = (data ?? []).map((a) => {
    const late = a.checkins.filter((c) => c.status === 'late' || (c.status === 'pending' && new Date(c.due_at).getTime() < now));
    const help = a.checkins.some((c) => c.needs_help && !c.ngo_followed_up_at);
    return { ...a, late: late.length, help };
  });
  const list = filtro === 'ajuda' ? rows.filter((r) => r.help) : filtro === 'atrasado' ? rows.filter((r) => r.late > 0) : filtro === 'devolvido' ? rows.filter((r) => r.status === 'returned') : rows;

  const tabs = [{ v: '', label: 'Todas' }, { v: 'ajuda', label: 'Pediram ajuda' }, { v: 'atrasado', label: 'Check-in atrasado' }, { v: 'devolvido', label: 'Devolvidas' }];

  return (
    <>
      <PageTitle title="Adoções e pós-adoção" subtitle={`${list.length} adoções`} />
      <nav className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {tabs.map((t) => (
          <Link key={t.v} href={t.v ? `/admin/adocoes?filtro=${t.v}` : '/admin/adocoes'}
            className={`flex min-h-9 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold ${(filtro ?? '') === t.v ? 'bg-ink text-white' : 'bg-white ring-1 ring-line'}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      <ul className="card divide-y divide-line">
        {list.map((a) => (
          <li key={a.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <p>
                <Link href={`/animais/${a.animals?.id}`} className="font-bold hover:text-brand">{a.animals?.name}</Link>
                <span className="text-sm text-muted"> com {a.profiles?.full_name}</span>
              </p>
              <p className="text-xs text-muted">
                <Link href={`/ongs/${a.ngos?.slug}`} className="hover:text-brand">{a.ngos?.name}</Link> · adotado em {fmtDate(a.adopted_at)}
                {!a.term_accepted_at && ' · termo ainda não aceito'}
                {a.return_reason && ` · devolução: ${a.return_reason}`}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {a.checkins.sort((x, y) => x.due_day - y.due_day).map((c) => {
                  const isLate = c.status === 'late' || (c.status === 'pending' && new Date(c.due_at).getTime() < now);
                  return (
                    <Badge key={c.due_day} tone={c.status === 'answered' ? 'good' : isLate ? 'bad' : 'neutral'}>
                      {c.due_day} dias: {c.status === 'answered' ? 'respondido' : isLate ? 'atrasado' : 'pendente'}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              {a.status === 'returned' && <Badge tone="bad">Devolvido</Badge>}
              {a.help && <Badge tone="bad">Pediu ajuda</Badge>}
            </div>
          </li>
        ))}
        {!list.length && <li className="p-6 text-center text-sm text-muted">Nenhuma adoção aqui.</li>}
      </ul>
    </>
  );
}
