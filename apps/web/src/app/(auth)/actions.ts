'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/utils';

/** verify = e-mail aguardando a confirmação pelo link (a tela troca para "confira seu e-mail"). */
export type FormState = { error?: string; ok?: string; verify?: string } | undefined;

/** Para onde o link do e-mail leva: /auth/callback troca o código pela sessão e segue para `next`. */
async function confirmRedirect(next: string) {
  const h = await headers();
  const origin = h.get('origin') ?? `https://${h.get('host')}`;
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext(next))}`;
}

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const email = String(formData.get('email') ?? '').trim();
  const { error } = await supabase.auth.signInWithPassword({ email, password: String(formData.get('password') ?? '') });
  if (error?.code === 'email_not_confirmed') {
    await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: await confirmRedirect(String(formData.get('next') ?? '')) } });
    return { verify: email, ok: 'Falta confirmar seu e-mail. Enviamos um novo link.' };
  }
  if (error) return { error: 'E-mail ou senha incorretos.' };
  redirect(safeNext(String(formData.get('next') ?? '')));
}

/** Etapa 1 do cadastro: só nome completo, e-mail e senha. Depois, a pessoa confirma pelo link enviado por e-mail. */
export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get('full_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (fullName.split(/\s+/).length < 2) return { error: 'Informe seu nome completo.' };
  if (password.length < 8) return { error: 'A senha precisa ter pelo menos 8 caracteres.' };

  const supabase = await createClient();
  const next = String(formData.get('next') ?? '');
  const { data, error } = await supabase.auth.signUp({
    email, password, options: { data: { full_name: fullName }, emailRedirectTo: await confirmRedirect(next) },
  });
  if (error) {
    if (error.code === 'over_email_send_rate_limit') return { error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' };
    return { error: error.message.includes('registered') ? 'Este e-mail já tem conta. Entre com ele.' : 'Não foi possível criar a conta.' };
  }
  if (!data.session) return { verify: email };
  redirect(safeNext(next));
}

export async function resendConfirmation(email: string, next?: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: await confirmRedirect(next ?? '') } });
  if (error) return { error: error.code === 'over_email_send_rate_limit' ? 'Aguarde um pouco antes de pedir outro e-mail.' : 'Não foi possível reenviar agora.' };
  return {};
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
