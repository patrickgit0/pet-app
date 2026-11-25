'use client';

import { useI18n } from '@/i18n/client';
import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { resendConfirmation, signIn, signUp, type FormState } from './actions';

export function AuthForm({ mode, next, notice }: { mode: 'signin' | 'signup'; next?: string; notice?: { tone: 'ok' | 'error'; text: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === 'signin' ? signIn : signUp, undefined);
  const [dismissed, setDismissed] = useState<FormState>(undefined); // "Trocar e-mail" volta ao formulário
  const isSignup = mode === 'signup';
  const { t } = useI18n();

  if (state?.verify && state !== dismissed) {
    return <CheckEmailStep email={state.verify} next={next} notice={state.ok} onChangeEmail={() => setDismissed(state)} />;
  }

  return (
    <form action={action} className="card mx-auto mt-6 flex w-full max-w-md flex-col gap-4 p-5 sm:mt-12 sm:p-7">
      <h1 className="text-2xl font-extrabold">{isSignup ? t('Criar conta') : t('Entrar')}</h1>
      <p className="text-sm text-muted">{isSignup ? t('Encontre seu novo melhor amigo. Leva menos de um minuto.') : t('Bom te ver de novo.')}</p>
      <input type="hidden" name="next" value={next ?? ''} />
      {notice && !state && (
        <p role={notice.tone === 'error' ? 'alert' : 'status'}
          className={`rounded-xl p-3 text-sm font-semibold ${notice.tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-brand-soft text-brand-dark'}`}>
          {t(notice.text)}
        </p>
      )}
      {isSignup && (
        <label className="flex flex-col gap-1.5">
          <span className="label">{t('Nome completo')}</span>
          <input name="full_name" required autoComplete="name" className="field" />
        </label>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="label">{t('E-mail')}</span>
        <input name="email" type="email" required autoComplete="email" inputMode="email" className="field" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">{t('Senha')}</span>
        <input name="password" type="password" required minLength={isSignup ? 8 : undefined}
          autoComplete={isSignup ? 'new-password' : 'current-password'} className="field" />
        {isSignup && <span className="text-xs text-muted">{t('Pelo menos 8 caracteres.')}</span>}
        {!isSignup && <Link href="/esqueci-senha" className="self-end text-xs font-semibold text-brand">{t('Esqueci minha senha')}</Link>}
      </label>
      {state?.error && <p role="alert" className="text-sm font-semibold text-red-700">{t(state.error)}</p>}
      <button disabled={pending} className="btn-primary h-12 text-base">
        {pending ? t('Aguarde…') : isSignup ? t('Criar conta') : t('Entrar')}
      </button>
      <p className="text-center text-sm text-muted">
        {isSignup ? (
          <>{t('Já tem conta?')} <Link href={`/entrar${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-bold text-brand">{t('Entrar')}</Link></>
        ) : (
          <>{t('Ainda não tem conta?')} <Link href={`/criar-conta${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-bold text-brand">{t('Criar conta')}</Link></>
        )}
      </p>
    </form>
  );
}

/** Aguardando a confirmação: o link foi enviado por e-mail. Reenvio liberado após 60 s. */
function CheckEmailStep({ email, next, notice, onChangeEmail }: { email: string; next?: string; notice?: string; onChangeEmail: () => void }) {
  const [wait, setWait] = useState(60);
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();
  const [msg, setMsg] = useState<string | null>(notice ?? null);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  async function resend() {
    setMsg(null);
    setBusy(true);
    const r = await resendConfirmation(email, next);
    setBusy(false);
    setMsg(r.error ?? 'Enviamos um novo link.');
    if (!r.error) setWait(60);
  }

  return (
    <div className="card mx-auto mt-6 flex w-full max-w-md flex-col gap-4 p-5 text-center sm:mt-12 sm:p-7">
      <span aria-hidden className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-2xl">✉️</span>
      <h1 className="text-2xl font-extrabold">{t('Confirme seu e-mail')}</h1>
      <p className="text-sm text-muted">
        {t('Enviamos um link de confirmação para')} <strong className="text-ink">{email}</strong>.{' '}
        {t('Abra o e-mail e clique no link para ativar sua conta.')}
      </p>
      <p role="status" className="flex items-center justify-center gap-2 rounded-xl bg-accent-soft p-3 text-sm font-semibold text-accent-ink">
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden />
        {t('Aguardando a confirmação no seu e-mail…')}
      </p>
      <p className="text-xs text-muted">{t('Pode levar um minutinho; confira também o spam e a aba Promoções.')}</p>
      {msg && <p className="text-sm font-semibold text-brand-dark">{t(msg)}</p>}
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onChangeEmail} className="font-semibold text-muted hover:text-ink">{t('Trocar e-mail')}</button>
        <button type="button" onClick={resend} disabled={wait > 0 || busy} className="font-bold text-brand disabled:font-semibold disabled:text-muted">
          {wait > 0 ? t('Reenviar em {s}s', { s: wait }) : t('Reenviar e-mail')}
        </button>
      </div>
    </div>
  );
}
