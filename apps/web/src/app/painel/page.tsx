import Link from 'next/link';
import { formatRating, REQUEST_STATUS_LABEL } from '@adotai/shared';
import { getMyNgo } from '@/lib/ngo';
import { PlusIcon } from '@/components/icons';

export default async function Overview() {
  const { supabase, ngo } = await getMyNgo();
  const ngoId = ngo!.id;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [available, newReqs, adoptionsMonth, requests, alerts] = await Promise.all([
    supabase.from('animals').select('id', { count: 'exact', head: true }).eq('ngo_id', ngoId).eq('status', 'available'),
    supabase.from('adoption_requests').select('id', { count: 'exact', head: true }).eq('ngo_id', ngoId).eq('status', 'sent'),
    supabase.from('adoptions').select('id', { count: 'exact', head: true }).eq('ngo_id', ngoId).gte('adopted_at', monthStart),
    supabase.from('adoption_requests')
      .select('id, status, created_at, animals(name), profiles!adoption_requests_adopter_id_fkey(full_name)')
      .eq('ngo_id', ngoId).in('status', ['sent', 'reviewing', 'visit_scheduled', 'approved'])
      .order('created_at', { ascending: false }).limit(8),
    supabase.from('checkins')
      .select('id, due_day, status, needs_help, adoptions!inner(ngo_id, animals(name))')
      .eq('adoptions.ngo_id', ngoId).or('status.eq.late,needs_help.eq.true').is('ngo_followed_up_at', null).limit(5),
  ]);

  const rating = formatRating(ngo!.rating);
  const kpis = [
    { label: 'Animais disponíveis', value: available.count ?? 0 },
    { label: 'Pedidos novos', value: newReqs.count ?? 0 },
    { label: 'Adoções neste mês', value: adoptionsMonth.count ?? 0 },
    { label: 'Nota da ONG', value: rating ?? 'Nova', sub: ngo!.completed_adoptions < 5 ? `${ngo!.completed_adoptions}/5 adoções para ter nota` : undefined },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Visão geral</h1>
          <p className="text-sm text-muted">{newReqs.count ?? 0} pedidos novos e {alerts.data?.length ?? 0} alertas de pós-adoção.</p>
        </div>
        <Link href="/painel/animais/novo" className="btn-primary"><PlusIcon size={18} /> Cadastrar animal</Link>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
        {kpis.map((k) => (
          <div key={k.label} className="card flex flex-col gap-1 p-4">
            <span className="text-[13px] text-muted">{k.label}</span>
            <span className="text-[28px] font-extrabold">{k.value}</span>
            {k.sub && <span className="text-xs font-semibold text-brand-dark">{k.sub}</span>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <section className="card min-w-0 flex-[999_1_480px] p-5">
          <h2 className="mb-3 text-[17px] font-extrabold">Candidatos recentes</h2>
          <ul className="divide-y divide-line">
            {(requests.data ?? []).map((r) => (
              <li key={r.id}>
                <Link href={`/painel/pedidos/${r.id}`} className="flex items-center justify-between gap-3 py-3">
                  <span className="flex flex-col">
                    <strong className="text-sm">{r.profiles?.full_name}</strong>
                    <span className="text-xs text-muted">{r.animals?.name} · {new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
                  </span>
                  <span className="rounded-md bg-accent-soft px-2 py-1 text-xs font-bold text-accent-ink">{REQUEST_STATUS_LABEL[r.status]}</span>
                </Link>
              </li>
            ))}
            {!requests.data?.length && <li className="py-6 text-center text-sm text-muted">Nenhum pedido em aberto.</li>}
          </ul>
        </section>
        <section className="card min-w-0 flex-[1_1_300px] p-5">
          <h2 className="mb-3 text-[17px] font-extrabold">Pós-adoção</h2>
          {(alerts.data ?? []).map((c) => (
            <Link key={c.id} href="/painel/pos-adocao" className="mb-2 block rounded-xl bg-accent-soft p-3 text-sm">
              <strong>{c.adoptions?.animals?.name}</strong> · {c.needs_help ? '"Estou com dificuldade"' : `check-in de ${c.due_day} dias atrasado`}
            </Link>
          ))}
          {!alerts.data?.length && <p className="text-sm text-muted">Nenhum alerta. Tudo em dia.</p>}
        </section>
      </div>
    </div>
  );
}
