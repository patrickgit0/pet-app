import Link from 'next/link';
import { notFound } from 'next/navigation';
import { REQUEST_STATUS_LABEL } from '@adotai/shared';
import { getSession } from '@/lib/supabase/server';
import { tintFor } from '@/lib/utils';
import { BackIcon } from '@/components/icons';
import { ChatRoom } from './chat-room';
import { myConversationsFilter } from '@/lib/conversations';

export const metadata = { title: 'Conversa' };

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ pedido?: string }> }) {
  const { id } = await params;
  const { pedido } = await searchParams;
  const { supabase, user, profile } = await getSession();

  const { data: conv } = await supabase
    .from('conversations')
    .select('id, animal_id, adopter_id, ngo_id, blocked_at, animals(id, name), ngos(name), profiles!conversations_adopter_id_fkey(full_name)')
    .eq('id', id)
    .maybeSingle();
  if (!conv) notFound();

  const [{ data: messages }, { data: request }] = await Promise.all([
    supabase.from('messages').select('*').eq('conversation_id', id).order('created_at').limit(200),
    supabase.from('adoption_requests').select('id, status').eq('animal_id', conv.animal_id).eq('adopter_id', conv.adopter_id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  // Admin pode abrir qualquer conversa (moderação), mas só para ler: não envia nem marca como lida
  const { ngoIds } = await myConversationsFilter(supabase, user!.id);
  const participant = conv.adopter_id === user!.id || ngoIds.includes(conv.ngo_id);
  if (!participant && profile?.role !== 'admin') notFound();

  if (participant) {
    await supabase.from('messages').update({ read_at: new Date().toISOString() })
      .eq('conversation_id', id).neq('sender_id', user!.id).is('read_at', null);
  }

  const isNgo = participant && ngoIds.includes(conv.ngo_id);
  const title = !participant
    ? `${conv.profiles?.full_name ?? 'Adotante'} e ${conv.ngos?.name ?? 'ONG'}`
    : isNgo ? conv.profiles?.full_name ?? 'Adotante' : conv.ngos?.name ?? 'ONG';

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-6">
      <div className="flex items-center gap-2">
        <Link href={participant ? '/mensagens' : '/admin/adocoes'} aria-label="Voltar" className="btn-ghost h-11 w-11 rounded-full p-0"><BackIcon /></Link>
        <h1 className="text-lg font-extrabold">{title}</h1>
      </div>
      <Link href={`/animais/${conv.animal_id}`} className="card flex items-center gap-3 p-3">
        <span className="h-11 w-11 rounded-xl" style={{ background: tintFor(conv.animals?.name ?? '') }} />
        <span className="flex flex-1 flex-col">
          <span className="text-sm font-bold">{conv.animals?.name}{request ? ' · Pedido de adoção' : ''}</span>
          {isNgo && request && <span className="text-xs font-semibold text-brand">Ver candidato no painel →</span>}
        </span>
        {request && <span className="rounded-lg bg-accent-soft px-2 py-1 text-[11px] font-bold text-accent-ink">{REQUEST_STATUS_LABEL[request.status]}</span>}
      </Link>
      {pedido === 'enviado' && (
        <p role="status" className="rounded-xl bg-brand-soft p-3 text-sm font-semibold text-brand-dark">
          Pedido enviado! A ONG vai analisar seu perfil e responder por aqui.
        </p>
      )}
      {!participant && (
        <p role="status" className="rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">
          Você está vendo esta conversa como administrador. Só leitura: as mensagens do adotante ficam à direita.
        </p>
      )}
      <ChatRoom
        conversationId={id}
        me={participant ? user!.id : conv.adopter_id}
        readOnly={!participant}
        isNgo={isNgo}
        blocked={Boolean(conv.blocked_at)}
        initial={messages ?? []}
        requestId={isNgo ? request?.id : undefined}
      />
    </main>
  );
}
