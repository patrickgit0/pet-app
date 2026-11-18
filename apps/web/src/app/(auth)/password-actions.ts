'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type PwState = { error?: string; ok?: string } | undefined;

/** Envia o link de redefinição. Sempre responde igual, para não revelar quais e-mails têm conta. */
export async function requestPasswordReset(_: PwState, formData: FormData): Promise<PwState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email.includes('@')) return { error: 'Informe um e-mail válido.' };
  const h = await headers();
  const origin = h.get('origin') ?? `https://${h.get('host')}`;
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/redefinir-senha` });
  return { ok: 'Se este e-mail tiver conta, enviamos um link para criar uma senha nova. Confira também o spam.' };
}

export async function updatePassword(_: PwState, formData: FormData): Promise<PwState> {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  if (password.length < 8) return { error: 'A senha precisa ter pelo menos 8 caracteres.' };
  if (password !== confirm) return { error: 'As senhas não são iguais.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'O link expirou. Peça um novo em "Esqueci minha senha".' };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.code === 'same_password' ? 'Use uma senha diferente da anterior.' : 'Não foi possível trocar a senha. Tente de novo.' };
  redirect('/perfil?senha=1');
}
