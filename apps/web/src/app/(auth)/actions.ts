'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/utils';

/** verify = e-mail aguardando o código de confirmação (a tela troca para o passo do código). */
export type FormState = { error?: string; ok?: string; verify?: string } | undefined;

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const email = String(formData.get('email') ?? '').trim();
  const { error } = await supabase.auth.signInWithPassword({ email, password: String(formData.get('password') ?? '') });
  if (error?.code === 'email_not_confirmed') {
    await supabase.auth.resend({ type: 'signup', email });
    return { verify: email, ok: 'Falta confirmar seu e-mail. Enviamos um novo código.' };
  }
  if (error) return { error: 'E-mail ou senha incorretos.' };
  redirect(safeNext(String(formData.get('next') ?? '')));
}

/** Etapa 1 do cadastro: só nome completo, e-mail e senha. Depois, código de 6 dígitos por e-mail. */
export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get('full_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (fullName.split(/\s+/).length < 2) return { error: 'Informe seu nome completo.' };
  if (password.length < 8) return { error: 'A senha precisa ter pelo menos 8 caracteres.' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
  if (error) {
    if (error.code === 'over_email_send_rate_limit') return { error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' };
    return { error: error.message.includes('registered') ? 'Este e-mail já tem conta. Entre com ele.' : 'Não foi possível criar a conta.' };
  }
  if (!data.session) return { verify: email };
  redirect(safeNext(String(formData.get('next') ?? '')));
}

export async function verifyEmailCode(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '');
  const token = String(formData.get('code') ?? '').replace(/\D/g, '');
  if (token.length !== 6) return { verify: email, error: 'Digite os 6 números do código.' };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) return { verify: email, error: 'Código incorreto ou expirado. Peça um novo.' };
  redirect(safeNext(String(formData.get('next') ?? '')));
}

export async function resendEmailCode(email: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) return { error: error.code === 'over_email_send_rate_limit' ? 'Aguarde um pouco antes de pedir outro código.' : 'Não foi possível reenviar agora.' };
  return {};
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
