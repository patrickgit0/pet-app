'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/utils';

export type FormState = { error?: string; ok?: string } | undefined;

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email') ?? '').trim(),
    password: String(formData.get('password') ?? ''),
  });
  if (error) return { error: 'E-mail ou senha incorretos.' };
  redirect(safeNext(String(formData.get('next') ?? '')));
}

/** Etapa 1 do cadastro: só nome completo, e-mail e senha. */
export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get('full_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (fullName.split(/\s+/).length < 2) return { error: 'Informe seu nome completo.' };
  if (password.length < 8) return { error: 'A senha precisa ter pelo menos 8 caracteres.' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) {
    return { error: error.message.includes('registered') ? 'Este e-mail já tem conta. Entre com ele.' : 'Não foi possível criar a conta.' };
  }
  if (!data.session) return { ok: 'Conta criada! Confira seu e-mail para confirmar o cadastro.' };
  redirect(safeNext(String(formData.get('next') ?? '')));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
