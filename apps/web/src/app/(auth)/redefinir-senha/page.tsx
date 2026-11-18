import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import { pageTitle } from '@/i18n/server';
import { ResetPasswordForm } from '../password-forms';

export const generateMetadata = pageTitle('Criar senha nova');

/** Chega aqui pelo link do e-mail (o /auth/callback já abriu a sessão). */
export default async function Page() {
  const { user } = await getSession();
  if (!user) redirect('/esqueci-senha');
  return <main className="px-4"><ResetPasswordForm /></main>;
}
