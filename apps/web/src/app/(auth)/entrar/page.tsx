import { pageTitle } from '@/i18n/server';
import { AuthForm } from '../auth-form';

export const generateMetadata = pageTitle('Entrar');

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="px-4">
      <AuthForm mode="signin" next={next} />
    </main>
  );
}
