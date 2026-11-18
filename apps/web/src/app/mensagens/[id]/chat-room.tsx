'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Database } from '@adotai/shared';
import { createClient } from '@/lib/supabase/client';
import { CalendarIcon, SendIcon } from '@/components/icons';

type Msg = Database['public']['Tables']['messages']['Row'];

const QUICK_REPLIES = [
  'Obrigado pelo interesse! Pode me contar um pouco da sua rotina?',
  'Podemos agendar uma visita para você conhecer o animal?',
  'Seu pedido foi aprovado! Vamos combinar a entrega.',
];

export function ChatRoom({ conversationId, me, isNgo, blocked, initial, requestId }: {
  conversationId: string; me: string; isNgo: boolean; blocked: boolean; initial: Msg[]; requestId?: string;
}) {
  const supabase = createClient();
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [draft, setDraft] = useState('');
  const [showVisit, setShowVisit] = useState(false);
  const [visitAt, setVisitAt] = useState('');
  const [visitPlace, setVisitPlace] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ch = supabase
      .channel(`conv:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (p) => {
          const m = p.new as Msg;
          setMsgs((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
          if (m.sender_id !== me) supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', m.id).then();
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (p) => setMsgs((cur) => cur.map((x) => (x.id === (p.new as Msg).id ? (p.new as Msg) : x))))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, me, supabase]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);

  async function send(body: string, extra: Partial<Msg> = {}) {
    if (!body.trim() && !extra.kind) return;
    const { data, error } = await supabase.from('messages')
      .insert({ conversation_id: conversationId, sender_id: me, body: body.trim() || null, ...extra })
      .select().single();
    if (!error && data) setMsgs((cur) => (cur.some((x) => x.id === data.id) ? cur : [...cur, data]));
  }

  async function confirmVisit(id: string) {
    await supabase.from('messages').update({ visit_confirmed_at: new Date().toISOString() }).eq('id', id);
    setMsgs((cur) => cur.map((m) => (m.id === id ? { ...m, visit_confirmed_at: new Date().toISOString() } : m)));
  }

  return (
    <div className="card flex h-[65vh] min-h-[420px] flex-col overflow-hidden bg-ground">
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
        {msgs.map((m) => {
          const mine = m.sender_id === me;
          if (m.kind === 'system') {
            return <span key={m.id} className="self-center rounded-full bg-line px-3 py-1 text-[11px] text-muted">{m.body}</span>;
          }
          if (m.kind === 'visit_proposal') {
            return (
              <div key={m.id} className={`flex w-[78%] max-w-sm flex-col gap-1.5 rounded-2xl border-[1.5px] border-brand bg-white p-3 ${mine ? 'self-end' : 'self-start'}`}>
                <span className="flex items-center gap-1.5 text-xs font-bold text-brand"><CalendarIcon size={16} /> Proposta de visita</span>
                <span className="text-sm font-bold">{m.visit_at && new Date(m.visit_at).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                {m.visit_place && <span className="text-xs text-muted">{m.visit_place}</span>}
                {m.visit_confirmed_at ? (
                  <span className="rounded-lg bg-brand-soft py-2 text-center text-[13px] font-bold text-brand-dark">✓ Visita confirmada</span>
                ) : !mine ? (
                  <button onClick={() => confirmVisit(m.id)} className="btn-primary min-h-10">Confirmar visita</button>
                ) : (
                  <span className="text-xs text-muted">Aguardando confirmação</span>
                )}
              </div>
            );
          }
          return (
            <div key={m.id} className={`flex max-w-[78%] flex-col gap-0.5 ${mine ? 'self-end items-end' : 'self-start'}`}>
              <div className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${mine ? 'rounded-2xl rounded-br-sm bg-brand text-white' : 'rounded-2xl rounded-bl-sm border border-line bg-white'}`}>
                {m.body}
              </div>
              <span className="text-[10px] text-muted">
                {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                {mine && (m.read_at ? ' · lida' : ' · enviada')}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {isNgo && !blocked && (
        <div className="flex flex-wrap gap-2 border-t border-line bg-white px-3 pt-2">
          {QUICK_REPLIES.map((q) => (
            <button key={q} onClick={() => setDraft(q)} className="rounded-full bg-field px-3 py-1 text-xs font-semibold">{q.slice(0, 32)}…</button>
          ))}
          <button onClick={() => setShowVisit((v) => !v)} className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-dark">Propor visita</button>
          {requestId && <Link href={`/painel/pedidos/${requestId}`} className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-ink">Analisar pedido</Link>}
        </div>
      )}
      {showVisit && (
        <form className="flex flex-wrap gap-2 border-t border-line bg-white p-3" onSubmit={async (e) => {
          e.preventDefault();
          if (!visitAt) return;
          await send('', { kind: 'visit_proposal', visit_at: new Date(visitAt).toISOString(), visit_place: visitPlace || null });
          setShowVisit(false); setVisitAt(''); setVisitPlace('');
        }}>
          <input type="datetime-local" required value={visitAt} onChange={(e) => setVisitAt(e.target.value)} className="field h-11 w-auto" aria-label="Data e hora da visita" />
          <input value={visitPlace} onChange={(e) => setVisitPlace(e.target.value)} placeholder="Local" className="field h-11 flex-1" aria-label="Local da visita" />
          <button className="btn-primary">Enviar proposta</button>
        </form>
      )}

      {blocked ? (
        <p className="border-t border-line bg-white p-4 text-center text-sm text-muted">Esta conversa foi bloqueada.</p>
      ) : (
        <form className="flex items-center gap-2 border-t border-line bg-white p-3" onSubmit={(e) => { e.preventDefault(); send(draft); setDraft(''); }}>
          <input aria-label="Mensagem" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Escreva uma mensagem" className="h-11 flex-1 rounded-full bg-field px-4 text-sm outline-none" maxLength={4000} />
          <button aria-label="Enviar" className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white"><SendIcon /></button>
        </form>
      )}
    </div>
  );
}
