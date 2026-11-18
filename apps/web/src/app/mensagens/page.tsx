import Link from 'next/link';
import { getSession } from '@/lib/supabase/server';
import { initials, tintFor } from '@/lib/utils';
import { myConversationsFilter } from '@/lib/conversations';

export const metadata = { title: 'Mensagens' };

export default async function Page() {
  const { supabase, user, profile } = await getSession();
  const isNgo = profile?.role === 'ngo_member';

  const { filter } = await myConversationsFilter(supabase, user!.id);
  const { data: convs } = await supabase
    .from('conversations')
    .select('id, last_message_at, adopter_id, animals(name), ngos(name), profiles!conversations_adopter_id_fkey(full_name), messages(body, kind, sender_id, read_at, created_at)')
    .or(filter)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { referencedTable: 'messages', ascending: false })
    .limit(1, { referencedTable: 'messages' });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-5 text-2xl font-extrabold">Mensagens</h1>
      <div className="card divide-y divide-line">
        {(convs ?? []).map((c) => {
          const last = c.messages?.[0];
          const other = isNgo ? c.profiles?.full_name ?? 'Adotante' : c.ngos?.name ?? 'ONG';
          const unread = last && last.sender_id !== user!.id && !last.read_at;
          return (
            <Link key={c.id} href={`/mensagens/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-ground">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-extrabold text-ink" style={{ background: tintFor(other) }}>
                {initials(other)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className={`text-sm ${unread ? 'font-extrabold' : 'font-bold'}`}>{other} · {c.animals?.name}</span>
                <span className="truncate text-[13px] text-muted">{last?.kind === 'visit_proposal' ? 'Proposta de visita' : last?.body ?? 'Conversa iniciada'}</span>
              </span>
              {unread && <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-label="Não lida" />}
            </Link>
          );
        })}
        {!convs?.length && <p className="p-8 text-center text-muted">Nenhuma conversa ainda. Abra um animal e toque em &quot;Conversar&quot;.</p>}
      </div>
    </main>
  );
}
