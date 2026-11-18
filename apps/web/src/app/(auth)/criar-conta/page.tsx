import { AuthForm } from '../auth-form';

export const metadata = { title: 'Criar conta' };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="px-4">
      <AuthForm mode="signup" next={next} />
    </main>
  );
}
