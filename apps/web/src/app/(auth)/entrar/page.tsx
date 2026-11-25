import { pageTitle } from '@/i18n/server';
import { AuthForm } from '../auth-form';

export const generateMetadata = pageTitle('Entrar');

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; confirmado?: string; erro?: string }> }) {
  const { next, confirmado, erro } = await searchParams;
  const notice = confirmado
    ? { tone: 'ok' as const, text: 'E-mail confirmado! Entre com seu e-mail e senha.' }
    : erro === 'link'
      ? { tone: 'error' as const, text: 'Este link expirou ou já foi usado. Entre com seu e-mail e senha, ou peça um novo.' }
      : undefined;
  return (
    <main className="px-4">
      <AuthForm mode="signin" next={next} notice={notice} />
    </main>
  );
}
