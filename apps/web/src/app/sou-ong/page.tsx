import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import { NgoSignupForm } from './ngo-signup-form';

export const metadata = { title: 'Sou ONG' };

export default async function Page() {
  const { supabase, user } = await getSession();
  if (user) {
    const { count } = await supabase.from('ngo_members').select('ngo_id', { count: 'exact', head: true }).eq('user_id', user.id);
    if (count) redirect('/painel');
  }
  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-6 py-10 md:grid-cols-2">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-extrabold">Sua ONG no Adotaí</h1>
        <p className="text-ink-2">Divulgue seus animais para quem está perto, receba candidatos com CPF verificado e acompanhe cada adoção depois da entrega. É gratuito.</p>
        <ul className="flex flex-col gap-2 text-sm">
          <li>✓ Anúncios com fotos, saúde e temperamento</li>
          <li>✓ Painel de candidatos e chat com a equipe</li>
          <li>✓ Check-ins automáticos de pós-adoção</li>
          <li>✓ Nota pública baseada em resultados, não em popularidade</li>
        </ul>
      </section>
      {user ? (
        <NgoSignupForm />
      ) : (
        <div className="card flex flex-col items-start gap-3 p-6">
          <p className="font-bold">Primeiro, crie a conta da pessoa responsável pela ONG.</p>
          <Link href="/criar-conta?next=/sou-ong" className="btn-primary">Criar conta</Link>
          <Link href="/entrar?next=/sou-ong" className="text-sm font-semibold text-brand">Já tenho conta</Link>
        </div>
      )}
    </main>
  );
}
