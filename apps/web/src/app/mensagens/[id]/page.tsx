import Link from 'next/link';
import { notFound } from 'next/navigation';
import { REQUEST_STATUS_LABEL, animalPath } from '@adotai/shared';
import { createClient, getSession } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ConfirmSubmit } from '@/components/confirm';
import { ReportButton } from '@/components/report-button';
import { getI18n, pageTitle } from '@/i18n/server';
import { tintFor } from '@/lib/utils';
import { BackIcon } from '@/components/icons';
import { ChatRoom } from './chat-room';
import { myConversationsFilter } from '@/lib/conversations';

export const generateMetadata = pageTitle('Conversa');

async function toggleBlock(id: string, block: boolean) {
  'use server';
  const supabase = await createClient();
  await supabase.from('conversations').update({ blocked_at: block ? new Date().toISOString() : null }).eq('id', id);
  revalidatePath(`/mensagens/${id}`);
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ pedido?: string }> }) {
  const { id } = await params;
  const { pedido } = await searchParams;
  const { supabase, user, profile } = await getSession();

  const { data: conv } = await supabase
    .from('conversations')
    .select('id, animal_id, adopter_id, ngo_id, blocked_at, blocked_by, animals(id, name, code), ngos(name, address_text, neighborhood, city, state, opening_hours), profiles!conversations_adopter_id_fkey(full_name)')
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
  const { t } = await getI18n();
  const title = !participant
    ? t('{a} e {b}', { a: conv.profiles?.full_name ?? t('Adotante'), b: conv.ngos?.name ?? t('ONG') })
    : isNgo ? conv.profiles?.full_name ?? t('Adotante') : conv.ngos?.name ?? t('ONG');

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-6">
      <div className="flex items-center gap-2">
        <Link href={participant ? '/mensagens' : '/admin/adocoes'} aria-label={t('Voltar')} className="btn-ghost h-11 w-11 rounded-full p-0"><BackIcon /></Link>
        <h1 className="min-w-0 flex-1 truncate text-lg font-extrabold">{title}</h1>
        {participant && (
          <div className="flex shrink-0 items-center gap-3">
            <ReportButton type={isNgo ? 'user' : 'ngo'} id={isNgo ? conv.adopter_id : conv.ngo_id} loggedIn />
            {!conv.blocked_at ? (
              <form action={toggleBlock.bind(null, id, true)}>
                <ConfirmSubmit title="Bloquear esta conversa?" message="Ninguém mais consegue enviar mensagens aqui. Só você pode desbloquear depois." confirmLabel="Bloquear" tone="danger" className="text-xs font-semibold text-muted underline-offset-2 hover:underline">{t('Bloquear')}</ConfirmSubmit>
              </form>
            ) : conv.blocked_by === user!.id && (
              <form action={toggleBlock.bind(null, id, false)}>
                <ConfirmSubmit title="Desbloquear esta conversa?" message="As mensagens voltam a ser enviadas normalmente." confirmLabel="Desbloquear" className="text-xs font-semibold text-brand underline-offset-2 hover:underline">{t('Desbloquear')}</ConfirmSubmit>
              </form>
            )}
          </div>
        )}
      </div>
      <Link href={conv.animals ? animalPath(conv.animals) : `/animais/${conv.animal_id}`} className="card flex items-center gap-3 p-3">
        <span className="h-11 w-11 rounded-xl" style={{ background: tintFor(conv.animals?.name ?? '') }} />
        <span className="flex flex-1 flex-col">
          <span className="text-sm font-bold">{conv.animals?.name}{request ? ` · ${t('Pedido de adoção')}` : ''}</span>
          {isNgo && request && <span className="text-xs font-semibold text-brand">{t('Ver candidato no painel →')}</span>}
        </span>
        {request && <span className="rounded-lg bg-accent-soft px-2 py-1 text-[11px] font-bold text-accent-ink">{t(REQUEST_STATUS_LABEL[request.status])}</span>}
      </Link>
      {pedido === 'enviado' && (
        <p role="status" className="rounded-xl bg-brand-soft p-3 text-sm font-semibold text-brand-dark">
          {t('Pedido enviado! A ONG vai analisar seu perfil e responder por aqui.')}
        </p>
      )}
      {!participant && (
        <p role="status" className="rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">
          {t('Você está vendo esta conversa como administrador. Só leitura: as mensagens do adotante ficam à direita.')}
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
        ngoHours={conv.ngos?.opening_hours ?? null}
        defaultPlace={isNgo ? [conv.ngos?.name, conv.ngos?.address_text || [conv.ngos?.neighborhood, conv.ngos?.city].filter(Boolean).join(', ')].filter(Boolean).join(' — ') : ''}
      />
    </main>
  );
}
