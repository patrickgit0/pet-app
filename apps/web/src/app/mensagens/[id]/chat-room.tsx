'use client';

import { useConfirm } from '@/components/confirm';
import { useI18n } from '@/i18n/client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { hoursOn, parseOpeningHours, visitSlots, type Database, type OpeningHours } from '@adotai/shared';
import { createClient } from '@/lib/supabase/client';
import { CalendarIcon, SendIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

type Msg = Database['public']['Tables']['messages']['Row'];

const QUICK_REPLIES = [
  'Obrigado pelo interesse! Pode me contar um pouco da sua rotina?',
  'Podemos agendar uma visita para você conhecer o animal?',
  'Seu pedido foi aprovado! Vamos combinar a entrega.',
];
const CHAT_BUCKET = 'chat-attachments';
const MAX_PHOTO_MB = 8;

export function ChatRoom({ conversationId, me, isNgo, blocked, initial, requestId, readOnly = false, defaultPlace = '', ngoHours = null }: {
  conversationId: string; me: string; isNgo: boolean; blocked: boolean; initial: Msg[]; requestId?: string;
  readOnly?: boolean; defaultPlace?: string; ngoHours?: unknown;
}) {
  const supabase = createClient();
  const { t, locale } = useI18n();
  const [confirm, confirmDialog] = useConfirm();
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [draft, setDraft] = useState('');
  const [showVisit, setShowVisit] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    return !error;
  }

  async function confirmVisit(id: string) {
    await supabase.from('messages').update({ visit_confirmed_at: new Date().toISOString() }).eq('id', id);
    setMsgs((cur) => cur.map((m) => (m.id === id ? { ...m, visit_confirmed_at: new Date().toISOString() } : m)));
  }

  async function sendPhoto(file: File) {
    setError(null);
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) return setError(t('Envie uma foto (JPG, PNG ou WebP).'));
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) return setError(t('A foto pode ter no máximo {n} MB.', { n: MAX_PHOTO_MB }));
    if (!(await confirm({ title: 'Enviar esta foto?', message: 'Ela fica visível só para você e a outra pessoa da conversa.', confirmLabel: 'Enviar foto' }))) return;
    setUploading(true);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${conversationId}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from(CHAT_BUCKET).upload(path, file, { contentType: file.type });
    if (up.error) { setUploading(false); return setError(t('Não foi possível enviar a foto. Tente de novo.')); }
    const ok = await send(draft, { kind: 'image', attachment_path: path });
    if (ok) setDraft('');
    setUploading(false);
  }

  return (
    <div className="card flex h-[70vh] min-h-[440px] flex-col overflow-hidden bg-ground">
      {confirmDialog}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
        {msgs.map((m) => {
          const mine = m.sender_id === me;
          const time = (
            <span className="text-[10px] text-muted">
              {new Date(m.created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              {mine && (m.read_at ? ` · ${t('lida')}` : ` · ${t('enviada')}`)}
            </span>
          );
          if (m.kind === 'system') {
            return <span key={m.id} className="self-center rounded-full bg-line px-3 py-1 text-[11px] text-muted">{m.body}</span>;
          }
          if (m.kind === 'visit_proposal') {
            return (
              <div key={m.id} className={`flex w-[78%] max-w-sm flex-col gap-1.5 rounded-2xl border-[1.5px] border-brand bg-white p-3 ${mine ? 'self-end' : 'self-start'}`}>
                <span className="flex items-center gap-1.5 text-xs font-bold text-brand"><CalendarIcon size={16} /> {t('Proposta de visita')}</span>
                <span className="text-sm font-bold first-letter:uppercase">{m.visit_at && new Date(m.visit_at).toLocaleString(locale, { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
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
          if (m.kind === 'image' && m.attachment_path) {
            return (
              <div key={m.id} className={`flex max-w-[78%] flex-col gap-1 ${mine ? 'self-end items-end' : 'self-start'}`}>
                <ChatImage path={m.attachment_path} />
                {m.body && (
                  <div className={`px-3.5 py-2 text-sm whitespace-pre-wrap ${mine ? 'rounded-2xl rounded-br-sm bg-brand text-white' : 'rounded-2xl rounded-bl-sm border border-line bg-white'}`}>{m.body}</div>
                )}
                {time}
              </div>
            );
          }
          return (
            <div key={m.id} className={`flex max-w-[78%] flex-col gap-0.5 ${mine ? 'self-end items-end' : 'self-start'}`}>
              <div className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${mine ? 'rounded-2xl rounded-br-sm bg-brand text-white' : 'rounded-2xl rounded-bl-sm border border-line bg-white'}`}>
                {m.body}
              </div>
              {time}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {isNgo && !blocked && !readOnly && (
        <div className="flex gap-2 overflow-x-auto border-t border-line bg-white px-3 py-2 [scrollbar-width:none]">
          <button onClick={() => setShowVisit(true)} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-dark">
            <CalendarIcon size={14} /> {t('Propor visita')}
          </button>
          {requestId && <Link href={`/painel/pedidos/${requestId}`} className="shrink-0 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent-ink">{t('Analisar pedido')}</Link>}
          {QUICK_REPLIES.map((q) => (
            <button key={q} onClick={() => setDraft(t(q))} className="shrink-0 rounded-full bg-field px-3 py-1.5 text-xs font-semibold">{t(q).slice(0, 30)}…</button>
          ))}
        </div>
      )}
      {showVisit && (
        <VisitPicker
          defaultPlace={defaultPlace}
          hours={parseOpeningHours(ngoHours)}
          onCancel={() => setShowVisit(false)}
          onSend={async (at, place) => {
            const when = at.toLocaleString(locale, { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            if (!(await confirm({ title: 'Enviar proposta de visita?', message: `${when}${place ? ` · ${place}` : ''}`, confirmLabel: 'Enviar proposta' }))) return;
            await send('', { kind: 'visit_proposal', visit_at: at.toISOString(), visit_place: place || null });
            setShowVisit(false);
          }}
        />
      )}

      {error && <p role="alert" className="border-t border-line bg-white px-4 pt-2 text-xs font-semibold text-red-700">{error}</p>}
      {readOnly ? null : blocked ? (
        <p className="border-t border-line bg-white p-4 text-center text-sm text-muted">{t('Esta conversa foi bloqueada.')}</p>
      ) : (
        <form className="flex items-center gap-2 border-t border-line bg-white p-3" onSubmit={(e) => { e.preventDefault(); send(draft); setDraft(''); }}>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1}
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) sendPhoto(f); }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label={t('Enviar foto')} title={t('Enviar foto')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-field hover:text-ink disabled:opacity-50">
            {uploading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-line-2 border-t-brand" /> : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="5" width="18" height="15" rx="3" /><circle cx="9" cy="11" r="2" /><path d="m21 17-5-5-8 8" />
              </svg>
            )}
          </button>
          <input aria-label={t('Mensagem')} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t('Escreva uma mensagem')} className="h-11 min-w-0 flex-1 rounded-full bg-field px-4 text-sm outline-none" maxLength={4000} />
          <button aria-label={t('Enviar')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white"><SendIcon /></button>
        </form>
      )}
    </div>
  );
}

/** Foto do chat: bucket privado, link assinado de 1 h. Toque abre em tamanho grande. */
function ChatImage({ path }: { path: string }) {
  const { t } = useI18n();
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    createClient().storage.from(CHAT_BUCKET).createSignedUrl(path, 3600).then(({ data }) => {
      if (!alive) return;
      if (data?.signedUrl) setUrl(data.signedUrl); else setFailed(true);
    });
    return () => { alive = false; };
  }, [path]);
  if (failed) return <span className="rounded-2xl bg-field px-3 py-2 text-xs text-muted">{t('Foto indisponível')}</span>;
  if (!url) return <span className="block h-48 w-56 animate-pulse rounded-2xl bg-line" />;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl border border-line bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={t('Foto enviada na conversa')} className="max-h-72 w-auto max-w-full object-cover" />
    </a>
  );
}

/** Proposta de visita em janela: calendário do mês + horários do expediente da ONG + local. */
function VisitPicker({ defaultPlace, hours, onSend, onCancel }: {
  defaultPlace: string; hours: OpeningHours | null; onSend: (at: Date, place: string) => Promise<void>; onCancel: () => void;
}) {
  const { t, locale } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [today] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const maxDay = new Date(today); maxDay.setDate(maxDay.getDate() + 60);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [day, setDay] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [place, setPlace] = useState(defaultPlace);
  const [busy, setBusy] = useState(false);

  useEffect(() => { ref.current?.showModal(); }, []);

  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const slotsFor = (d: Date) => visitSlots(hours, d).filter((s) => {
    if (d.getTime() !== today.getTime()) return true;
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m > nowMin + 60; // hoje: pelo menos 1 h de antecedência
  });
  const selectable = (d: Date) => d >= today && d <= maxDay && slotsFor(d).length > 0;

  // grade do mês começando no domingo
  const first = new Date(month);
  const start = new Date(first); start.setDate(1 - first.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2026, 10, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' })); // 1/11/2026 = domingo
  const canPrev = month > new Date(today.getFullYear(), today.getMonth(), 1);
  const canNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= maxDay;
  const slots = day ? slotsFor(day) : [];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!day || !time) return;
    const [h, m] = time.split(':').map(Number);
    const at = new Date(day); at.setHours(h, m, 0, 0);
    setBusy(true);
    await onSend(at, place.trim());
    setBusy(false);
  }

  return (
    <dialog ref={ref} onCancel={(e) => { e.preventDefault(); onCancel(); }} onClick={(e) => { if (e.target === ref.current) onCancel(); }}
      aria-labelledby="visit-title" className="m-auto w-[min(94vw,640px)] rounded-2xl bg-white p-0 text-ink shadow-xl backdrop:bg-ink/40">
      <form onSubmit={submit} className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 id="visit-title" className="flex items-center gap-2 text-lg font-extrabold"><CalendarIcon size={20} className="text-brand" /> {t('Propor visita')}</h2>
          <button type="button" onClick={onCancel} aria-label={t('Fechar')} className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-field">✕</button>
        </div>

        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_200px]">
          {/* Calendário */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <button type="button" disabled={!canPrev} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                aria-label={t('Mês anterior')} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-field disabled:opacity-30">‹</button>
              <span className="text-sm font-extrabold first-letter:uppercase">{month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</span>
              <button type="button" disabled={!canNext} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                aria-label={t('Próximo mês')} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-field disabled:opacity-30">›</button>
            </div>
            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-muted uppercase">
              {weekdays.map((w, i) => <span key={i} className="py-1">{w}</span>)}
            </div>
            <div role="grid" aria-label={t('Dia da visita')} className="grid grid-cols-7 gap-1">
              {cells.map((d) => {
                const inMonth = d.getMonth() === month.getMonth();
                const ok = inMonth && selectable(d);
                const sel = day?.getTime() === d.getTime();
                const isToday = d.getTime() === today.getTime();
                return (
                  <button key={d.toISOString()} type="button" disabled={!ok} aria-pressed={sel}
                    aria-label={d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                    onClick={() => { setDay(d); setTime(null); }}
                    className={cn('flex aspect-square items-center justify-center rounded-xl text-sm font-semibold transition-colors',
                      !inMonth && 'invisible',
                      sel ? 'bg-brand text-white' : ok ? 'hover:bg-brand-soft' : 'text-line-2 line-through decoration-1',
                      isToday && !sel && 'ring-[1.5px] ring-brand ring-inset')}>
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
            {hours && <p className="mt-2 text-xs text-muted">{t('Dias riscados: ONG fechada ou fora do prazo.')}</p>}
          </div>

          {/* Horários */}
          <div className="flex flex-col gap-2">
            <span className="label first-letter:uppercase">{day ? day.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: '2-digit' }) : t('Horário')}</span>
            {!day ? (
              <p className="rounded-xl bg-ground p-3 text-sm text-muted">{t('Escolha um dia no calendário.')}</p>
            ) : (
              <>
                {hours && hoursOn(hours, day) && <span className="text-xs text-muted">{t('Aberto das {a} às {b}', { a: hoursOn(hours, day)!.open, b: hoursOn(hours, day)!.close })}</span>}
                <div className="grid max-h-56 grid-cols-3 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                  {slots.map((s) => (
                    <button key={s} type="button" aria-pressed={time === s} onClick={() => setTime(s)}
                      className={cn('min-h-10 rounded-xl text-sm font-semibold ring-[1.5px] ring-inset', time === s ? 'bg-brand text-white ring-brand' : 'ring-line-2 hover:bg-field')}>
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="label">{t('Local da visita')}</span>
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder={t('Local')} className="field" />
        </label>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-ghost">{t('Cancelar')}</button>
          <button disabled={!day || !time || busy} className="btn-primary">
            {!day ? t('Escolha o dia') : !time ? t('Escolha o horário') : t('Enviar proposta')}
          </button>
        </div>
      </form>
    </dialog>
  );
}
