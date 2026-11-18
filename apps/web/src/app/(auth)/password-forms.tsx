'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/client';
import { requestPasswordReset, updatePassword, type PwState } from './password-actions';

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<PwState, FormData>(requestPasswordReset, undefined);
  return (
    <form action={action} className="card mx-auto mt-6 flex w-full max-w-md flex-col gap-4 p-5 sm:mt-12 sm:p-7">
      <h1 className="text-2xl font-extrabold">{t('Esqueci minha senha')}</h1>
      <p className="text-sm text-muted">{t('Digite o e-mail da sua conta. Vamos enviar um link para você criar uma senha nova.')}</p>
      <label className="flex flex-col gap-1.5">
        <span className="label">{t('E-mail')}</span>
        <input name="email" type="email" required autoComplete="email" inputMode="email" className="field" />
      </label>
      {state?.error && <p role="alert" className="text-sm font-semibold text-red-700">{t(state.error)}</p>}
      {state?.ok && <p role="status" className="rounded-xl bg-brand-soft p-3 text-sm font-semibold text-brand-dark">{t(state.ok)}</p>}
      <button disabled={pending} className="btn-primary h-12 text-base">{pending ? t('Aguarde…') : t('Enviar link')}</button>
      <Link href="/entrar" className="text-center text-sm font-semibold text-brand">{t('Voltar para o login')}</Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<PwState, FormData>(updatePassword, undefined);
  return (
    <form action={action} className="card mx-auto mt-6 flex w-full max-w-md flex-col gap-4 p-5 sm:mt-12 sm:p-7">
      <h1 className="text-2xl font-extrabold">{t('Criar senha nova')}</h1>
      <label className="flex flex-col gap-1.5">
        <span className="label">{t('Senha nova')}</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
        <span className="text-xs text-muted">{t('Pelo menos 8 caracteres.')}</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">{t('Repita a senha nova')}</span>
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="field" />
      </label>
      {state?.error && <p role="alert" className="text-sm font-semibold text-red-700">{t(state.error)}</p>}
      <button disabled={pending} className="btn-primary h-12 text-base">{pending ? t('Salvando…') : t('Salvar senha nova')}</button>
    </form>
  );
}
