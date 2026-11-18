'use client';

import { useConfirm } from '@/components/confirm';
import { useI18n } from '@/i18n/client';
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

export function ChatRoom({ conversationId, me, isNgo, blocked, initial, requestId, readOnly = false, defaultPlace = '' }: {
  conversationId: string; me: string; isNgo: boolean; blocked: boolean; initial: Msg[]; requestId?: string; readOnly?: boolean; defaultPlace?: string;
}) {
  const supabase = createClient();
  const { t, locale } = useI18n();
  const [confirm, confirmDialog] = useConfirm();
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [draft, setDraft] = useState('');
  const [showVisit, setShowVisit] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ch = supabase
      .channel(`conv:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (p) => {
          const m = p.new as Msg;
          setMsgs((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
          if (!readOnly && m.sender_id !== me) supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', m.id).then();
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (p) => setMsgs((cur) => cur.map((x) => (x.id === (p.new as Msg).id ? (p.new as Msg) : x))))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, me, supabase, readOnly]);

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
      {confirmDialog}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
        {msgs.map((m) => {
          const mine = m.sender_id === me;
          if (m.kind === 'system') {
            return <span key={m.id} className="self-center rounded-full bg-line px-3 py-1 text-[11px] text-muted">{m.body}</span>;
          }
          if (m.kind === 'visit_proposal') {
            return (
              <div key={m.id} className={`flex w-[78%] max-w-sm flex-col gap-1.5 rounded-2xl border-[1.5px] border-brand bg-white p-3 ${mine ? 'self-end' : 'self-start'}`}>
                <span className="flex items-center gap-1.5 text-xs font-bold text-brand"><CalendarIcon size={16} /> {t('Proposta de visita')}</span>
                <span className="text-sm font-bold">{m.visit_at && new Date(m.visit_at).toLocaleString(locale, { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                {m.visit_place && <span className="text-xs text-muted">{m.visit_place}</span>}
                {m.visit_confirmed_at ? (
                  <span className="rounded-lg bg-brand-soft py-2 text-center text-[13px] font-bold text-brand-dark">✓ {t('Visita confirmada')}</span>
                ) : !mine && !readOnly ? (
                  <button onClick={async () => { if (await confirm({ title: 'Confirmar a visita?', message: 'A ONG verá que você confirmou o dia, o horário e o local.', confirmLabel: 'Confirmar visita' })) confirmVisit(m.id); }} className="btn-primary min-h-10">{t('Confirmar visita')}</button>
                ) : (
                  <span className="text-xs text-muted">{t('Aguardando confirmação')}</span>
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
                {new Date(m.created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                {mine && (m.read_at ? ` · ${t('lida')}` : ` · ${t('enviada')}`)}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {isNgo && !blocked && !readOnly && (
        <div className="flex flex-wrap gap-2 border-t border-line bg-white px-3 pt-2">
          {QUICK_REPLIES.map((q) => (
            <button key={q} onClick={() => setDraft(t(q))} className="rounded-full bg-field px-3 py-1 text-xs font-semibold">{t(q).slice(0, 32)}…</button>
          ))}
          <button onClick={() => setShowVisit((v) => !v)} className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-dark">{t('Propor visita')}</button>
          {requestId && <Link href={`/painel/pedidos/${requestId}`} className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-ink">{t('Analisar pedido')}</Link>}
        </div>
      )}
      {showVisit && (
        <VisitPicker
          defaultPlace={defaultPlace}
          onCancel={() => setShowVisit(false)}
          onSend={async (at, place) => {
            const when = at.toLocaleString(locale, { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            if (!(await confirm({ title: 'Enviar proposta de visita?', message: `${when}${place ? ` · ${place}` : ''}`, confirmLabel: 'Enviar proposta' }))) return;
            await send('', { kind: 'visit_proposal', visit_at: at.toISOString(), visit_place: place || null });
            setShowVisit(false);
          }}
        />
      )}

      {readOnly ? null : blocked ? (
        <p className="border-t border-line bg-white p-4 text-center text-sm text-muted">{t('Esta conversa foi bloqueada.')}</p>
      ) : (
        <form className="flex items-center gap-2 border-t border-line bg-white p-3" onSubmit={(e) => { e.preventDefault(); send(draft); setDraft(''); }}>
          <input aria-label={t('Mensagem')} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t('Escreva uma mensagem')} className="h-11 flex-1 rounded-full bg-field px-4 text-sm outline-none" maxLength={4000} />
          <button aria-label={t('Enviar')} className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white"><SendIcon /></button>
        </form>
      )}
    </div>
  );
}

const TIMES = Array.from({ length: 24 }, (_, i) => `${String(8 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`); // 08:00–19:30

/** Proposta de visita: próximos 14 dias como botões + horário de 30 em 30 min + local (endereço da ONG por padrão). */
function VisitPicker({ defaultPlace, onSend, onCancel }: { defaultPlace: string; onSend: (at: Date, place: string) => Promise<void>; onCancel: () => void }) {
  const { t, locale } = useI18n();
  const [days] = useState(() => Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d; }));
  const [day, setDay] = useState<number | null>(null);
  const [time, setTime] = useState('10:00');
  const [place, setPlace] = useState(defaultPlace);
  const [busy, setBusy] = useState(false);

  const label = (d: Date, i: number) =>
    i === 0 ? t('Hoje') : i === 1 ? t('Amanhã') : d.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (day === null) return;
    const [h, m] = time.split(':').map(Number);
    const at = new Date(days[day]);
    at.setHours(h, m, 0, 0);
    setBusy(true);
    await onSend(at, place.trim());
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 border-t border-line bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-extrabold"><CalendarIcon size={18} className="text-brand" /> {t('Propor visita')}</span>
        <button type="button" onClick={onCancel} className="text-xs font-semibold text-muted hover:text-ink">{t('Cancelar')}</button>
      </div>
      <div role="radiogroup" aria-label={t('Dia da visita')} className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
        {days.map((d, i) => (
          <button key={i} type="button" role="radio" aria-checked={day === i} onClick={() => setDay(i)}
            className={`flex min-w-[58px] shrink-0 flex-col items-center rounded-xl px-2 py-2 text-xs ring-[1.5px] ring-inset ${day === i ? 'bg-brand text-white ring-brand' : 'bg-white ring-line-2 hover:bg-field'}`}>
            <span className="font-semibold capitalize">{label(d, i)}</span>
            <span className="text-base font-extrabold">{d.getDate()}</span>
            <span className={day === i ? 'text-white/80' : 'text-muted'}>{d.toLocaleDateString(locale, { month: 'short' }).replace('.', '')}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={time} onChange={(e) => setTime(e.target.value)} aria-label={t('Horário')} className="field h-11 w-auto text-sm font-semibold">
          {TIMES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder={t('Local')} aria-label={t('Local da visita')} className="field h-11 min-w-0 flex-[1_1_200px] text-sm" />
      </div>
      <button disabled={day === null || busy} className="btn-primary">{day === null ? t('Escolha o dia') : t('Enviar proposta')}</button>
    </form>
  );
}
