'use client';

import { useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { resendEmailCode, signIn, signUp, verifyEmailCode, type FormState } from './actions';

export function AuthForm({ mode, next }: { mode: 'signin' | 'signup'; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === 'signin' ? signIn : signUp, undefined);
  const [dismissed, setDismissed] = useState<FormState>(undefined); // "Trocar e-mail" volta ao formulário
  const isSignup = mode === 'signup';

  if (state?.verify && state !== dismissed) {
    return <CodeStep email={state.verify} next={next} notice={state.ok} onChangeEmail={() => setDismissed(state)} />;
  }

  return (
    <form action={action} className="card mx-auto mt-6 flex w-full max-w-md flex-col gap-4 p-5 sm:mt-12 sm:p-7">
      <h1 className="text-2xl font-extrabold">{isSignup ? 'Criar conta' : 'Entrar'}</h1>
      <p className="text-sm text-muted">{isSignup ? 'Encontre seu novo melhor amigo. Leva menos de um minuto.' : 'Bom te ver de novo.'}</p>
      <input type="hidden" name="next" value={next ?? ''} />
      {isSignup && (
        <label className="flex flex-col gap-1.5">
          <span className="label">Nome completo</span>
          <input name="full_name" required autoComplete="name" className="field" />
        </label>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="label">E-mail</span>
        <input name="email" type="email" required autoComplete="email" inputMode="email" className="field" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Senha</span>
        <input name="password" type="password" required minLength={isSignup ? 8 : undefined}
          autoComplete={isSignup ? 'new-password' : 'current-password'} className="field" />
        {isSignup && <span className="text-xs text-muted">Pelo menos 8 caracteres.</span>}
      </label>
      {state?.error && <p role="alert" className="text-sm font-semibold text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary h-12 text-base">
        {pending ? 'Aguarde…' : isSignup ? 'Criar conta' : 'Entrar'}
      </button>
      <p className="text-center text-sm text-muted">
        {isSignup ? (
          <>Já tem conta? <Link href={`/entrar${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-bold text-brand">Entrar</Link></>
        ) : (
          <>Ainda não tem conta? <Link href={`/criar-conta${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-bold text-brand">Criar conta</Link></>
        )}
      </p>
    </form>
  );
}

/** Passo do código: 6 dígitos enviados por e-mail, com reenvio após 60 s. */
function CodeStep({ email, next, notice, onChangeEmail }: { email: string; next?: string; notice?: string; onChangeEmail: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(verifyEmailCode, undefined);
  const [wait, setWait] = useState(60);
  const [msg, setMsg] = useState<string | null>(notice ?? null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function resend() {
    setMsg(null);
    const r = await resendEmailCode(email);
    setMsg(r.error ?? 'Enviamos um novo código.');
    if (!r.error) setWait(60);
  }

  return (
    <form action={action} className="card mx-auto mt-6 flex w-full max-w-md flex-col gap-4 p-5 sm:mt-12 sm:p-7">
      <h1 className="text-2xl font-extrabold">Confirme seu e-mail</h1>
      <p className="text-sm text-muted">
        Enviamos um código de 6 números para <strong className="text-ink">{email}</strong>. Pode levar um minutinho; confira também o spam.
      </p>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next ?? ''} />
      <label className="flex flex-col gap-1.5">
        <span className="label">Código</span>
        <input name="code" required autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}"
          placeholder="000000" className="field h-14 text-center text-2xl font-bold tracking-[0.5em]" />
      </label>
      {state?.error && <p role="alert" className="text-sm font-semibold text-red-700">{state.error}</p>}
      {msg && <p role="status" className="text-sm font-semibold text-brand-dark">{msg}</p>}
      <button disabled={pending} className="btn-primary h-12 text-base">{pending ? 'Confirmando…' : 'Confirmar'}</button>
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onChangeEmail} className="font-semibold text-muted hover:text-ink">Trocar e-mail</button>
        <button type="button" onClick={resend} disabled={wait > 0} className="font-bold text-brand disabled:font-semibold disabled:text-muted">
          {wait > 0 ? `Reenviar em ${wait}s` : 'Reenviar código'}
        </button>
      </div>
    </form>
  );
}
