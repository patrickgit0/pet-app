'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';

export type ConfirmOptions = {
  /** Título da ação (em português; é traduzido aqui). */
  title: string;
  /** Explicação curta do que vai acontecer. */
  message?: string;
  confirmLabel?: string;
  /** "danger" para ações que não dá para desfazer (excluir, recusar, cancelar). */
  tone?: 'default' | 'danger';
};

/** Janela de confirmação do site (Cancelar / Confirmar). Usa <dialog>: foco preso, Esc fecha. */
function ConfirmDialog({ open, opts, onClose }: { open: boolean; opts: ConfirmOptions | null; onClose: (ok: boolean) => void }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => { e.preventDefault(); onClose(false); }}
      onClick={(e) => { if (e.target === ref.current) onClose(false); }}
      aria-labelledby="confirm-title"
      className="m-auto w-[min(92vw,420px)] rounded-2xl bg-white p-0 text-ink shadow-xl backdrop:bg-ink/40"
    >
      {opts && (
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-col gap-1.5">
            <h2 id="confirm-title" className="text-lg font-extrabold">{t(opts.title)}</h2>
            {opts.message && <p className="text-sm leading-relaxed text-ink-2">{t(opts.message)}</p>}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => onClose(false)} className="btn-ghost">{t('Cancelar')}</button>
            <button type="button" autoFocus onClick={() => onClose(true)}
              className={cn('btn', opts.tone === 'danger' ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-brand text-white hover:bg-brand-dark')}>
              {t(opts.confirmLabel ?? 'Confirmar')}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

/** Para ações em Client Components: const [confirm, dialog] = useConfirm(); if (await confirm({...})) ... */
export function useConfirm(): [(o: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [state, setState] = useState<{ opts: ConfirmOptions; resolve: (ok: boolean) => void } | null>(null);
  const confirm = useCallback((opts: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ opts, resolve })), []);
  const dialog = (
    <ConfirmDialog open={Boolean(state)} opts={state?.opts ?? null}
      onClose={(ok) => { state?.resolve(ok); setState(null); }} />
  );
  return [confirm, dialog];
}

/**
 * Botão de envio com confirmação, para formulários com Server Action:
 * <form action={...}><ConfirmSubmit title="Cancelar pedido?" ...>Cancelar</ConfirmSubmit></form>
 */
export function ConfirmSubmit({ children, className, ...opts }: ConfirmOptions & { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [confirm, dialog] = useConfirm();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    const form = ref.current?.form;
    if (!form || !form.reportValidity()) return;
    if (!(await confirm(opts))) return;
    setBusy(true);
    form.requestSubmit();
    setTimeout(() => setBusy(false), 4000); // o botão pode continuar na tela depois da ação (ex.: verificar/remover selo)
  }

  return (
    <>
      <button ref={ref} type="button" onClick={onClick} disabled={busy} className={className}>{children}</button>
      {dialog}
    </>
  );
}
