'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signIn, signUp, type FormState } from './actions';

export function AuthForm({ mode, next }: { mode: 'signin' | 'signup'; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === 'signin' ? signIn : signUp, undefined);
  const isSignup = mode === 'signup';

  return (
    <form action={action} className="card mx-auto mt-12 flex w-full max-w-md flex-col gap-4 p-7">
      <h1 className="text-2xl font-extrabold">{isSignup ? 'Criar conta' : 'Entrar'}</h1>
      <p className="text-sm text-muted">
        {isSignup
          ? 'Encontre seu novo melhor amigo. Leva menos de um minuto.'
          : 'Bom te ver de novo.'}
      </p>
      <input type="hidden" name="next" value={next ?? ''} />
      {isSignup && (
        <label className="flex flex-col gap-1.5">
          <span className="label">Nome completo</span>
          <input name="full_name" required autoComplete="name" className="field" />
        </label>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="label">E-mail</span>
        <input name="email" type="email" required autoComplete="email" className="field" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Senha</span>
        <input
          name="password"
          type="password"
          required
          minLength={isSignup ? 8 : undefined}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          className="field"
        />
      </label>
      {state?.error && <p role="alert" className="text-sm font-semibold text-red-700">{state.error}</p>}
      {state?.ok && <p role="status" className="text-sm font-semibold text-brand-dark">{state.ok}</p>}
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
