'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/client';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type Target = 'animal' | 'ngo' | 'message' | 'review' | 'user';
const REASONS: Record<Target, string[]> = {
  animal: ['Anúncio falso ou golpe', 'Venda de animal (cobrança fora das taxas de adoção)', 'Fotos impróprias', 'Maus-tratos', 'Outro motivo'],
  ngo: ['ONG falsa ou golpe', 'Cobrança indevida', 'Maus-tratos', 'Mau atendimento grave', 'Outro motivo'],
  message: ['Assédio ou ofensa', 'Golpe ou pedido de dinheiro', 'Conteúdo impróprio', 'Outro motivo'],
  review: ['Avaliação falsa', 'Ofensa', 'Outro motivo'],
  user: ['Assédio ou ofensa', 'Golpe ou pedido de dinheiro', 'Perfil falso', 'Conteúdo impróprio', 'Outro motivo'],
};

/** Botão "Denunciar" com janela de motivo. Grava em public.reports (o admin é avisado e analisa em /admin/denuncias). */
export function ReportButton({ type, id, loggedIn, className, label = 'Denunciar' }: { type: Target; id: string; loggedIn: boolean; className?: string; label?: string }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  if (!loggedIn) return <Link href="/entrar" className={cn('text-xs font-semibold text-muted underline-offset-2 hover:underline', className)}>{t(label)}</Link>;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const reason = [fd.get('reason'), String(fd.get('details') ?? '').trim()].filter(Boolean).join(' — ').slice(0, 1000);
    setState('busy');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('reports').insert({ reporter_id: user!.id, target_type: type, target_id: id, reason });
    // 23505 = já existe denúncia aberta sua para este alvo: tratamos como enviada
    setState(!error || error.code === '23505' ? 'done' : 'error');
  }

  return (
    <>
      <button type="button" onClick={() => { setState('idle'); ref.current?.showModal(); }}
        className={cn('text-xs font-semibold text-muted underline-offset-2 hover:underline', className)}>{t(label)}</button>
      <dialog ref={ref} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }} aria-labelledby={`report-${id}`}
        className="m-auto w-[min(92vw,440px)] rounded-2xl bg-white p-0 text-ink shadow-xl backdrop:bg-ink/40">
        {state === 'done' ? (
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <h2 id={`report-${id}`} className="text-lg font-extrabold">{t('Denúncia enviada')}</h2>
            <p className="text-sm text-ink-2">{t('Obrigado. A equipe do Vira Lar vai analisar. Se houver risco a um animal, procure também a polícia ou a prefeitura.')}</p>
            <button type="button" onClick={() => ref.current?.close()} className="btn-primary self-end">{t('Fechar')}</button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4 p-5 sm:p-6">
            <h2 id={`report-${id}`} className="text-lg font-extrabold">{t('Denunciar')}</h2>
            <fieldset className="flex flex-col gap-2">
              <legend className="label mb-1">{t('O que está acontecendo?')}</legend>
              {REASONS[type].map((r, i) => (
                <label key={r} className="flex min-h-10 items-center gap-2 text-sm">
                  <input type="radio" name="reason" value={r} required defaultChecked={i === 0} className="h-5 w-5 accent-brand" /> {t(r)}
                </label>
              ))}
            </fieldset>
            <textarea name="details" rows={3} maxLength={800} placeholder={t('Detalhes (opcional)')} className="field h-auto py-3" />
            {state === 'error' && <p role="alert" className="text-sm font-semibold text-red-700">{t('Não foi possível enviar. Tente de novo mais tarde.')}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => ref.current?.close()} className="btn-ghost">{t('Cancelar')}</button>
              <button type="submit" disabled={state === 'busy'} className="btn bg-red-700 text-white hover:bg-red-800">{t('Enviar denúncia')}</button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
