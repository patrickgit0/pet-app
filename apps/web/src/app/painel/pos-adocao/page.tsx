import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getMyNgo } from '@/lib/ngo';

const STATUS: Record<string, string> = { pending: 'Aguardando', answered: 'Respondido', late: 'Atrasado' };

async function markFollowedUp(checkinId: string) {
  'use server';
  const supabase = await createClient();
  await supabase.rpc('mark_checkin_followed_up', { p_checkin_id: checkinId });
  revalidatePath('/painel/pos-adocao');
}

export default async function Page({ searchParams }: { searchParams: Promise<{ nova?: string }> }) {
  const { nova } = await searchParams;
  const { supabase, ngo } = await getMyNgo();
  const { data: adoptions } = await supabase
    .from('adoptions')
    .select('id, adopted_at, status, animals(name), profiles!adoptions_adopter_id_fkey(full_name), checkins(id, due_day, due_at, status, needs_help, answers, answered_at, ngo_followed_up_at)')
    .eq('ngo_id', ngo!.id).order('adopted_at', { ascending: false });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Pós-adoção</h1>
      {nova && <p role="status" className="rounded-xl bg-brand-soft p-3 text-sm font-semibold text-brand-dark">Adoção registrada! Check-ins de 7 e 30 dias foram agendados.</p>}
      {(adoptions ?? []).map((a) => (
        <section key={a.id} className="card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-extrabold">{a.animals?.name} · {a.profiles?.full_name}</h2>
            <span className="text-xs text-muted">Adotado em {new Date(a.adopted_at).toLocaleDateString('pt-BR')}{a.status === 'returned' ? ' · Devolvido' : ''}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[...(a.checkins ?? [])].sort((x, y) => x.due_day - y.due_day).map((c) => {
              const alert = (c.status === 'late' || c.needs_help) && !c.ngo_followed_up_at;
              return (
                <div key={c.id} className={`flex flex-col gap-1 rounded-xl p-3 text-sm ${alert ? 'bg-accent-soft' : 'bg-ground'}`}>
                  <span className="font-bold">Check-in de {c.due_day} dias · {STATUS[c.status]}</span>
                  <span className="text-xs text-muted">Previsto para {new Date(c.due_at).toLocaleDateString('pt-BR')}</span>
                  {c.needs_help && <span className="text-xs font-bold text-accent-ink">Adotante pediu ajuda</span>}
                  {c.answers && <span className="text-xs">{Object.entries(c.answers as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(' · ')}</span>}
                  {alert && (
                    <form action={markFollowedUp.bind(null, c.id)}>
                      <button className="btn-ghost mt-1 min-h-9 px-3 text-xs">Marcar como acompanhado</button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {!adoptions?.length && <p className="card p-8 text-center text-muted">Nenhuma adoção registrada ainda.</p>}
    </div>
  );
}
