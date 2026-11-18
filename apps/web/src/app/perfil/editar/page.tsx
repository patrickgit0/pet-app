import Link from 'next/link';
import { getSession } from '@/lib/supabase/server';
import { BackIcon } from '@/components/icons';
import { ProfileForm } from './profile-form';

export const metadata = { title: 'Editar perfil' };

export default async function Page({ searchParams }: { searchParams: Promise<{ animal?: string }> }) {
  const { animal } = await searchParams;
  const { supabase, user, profile } = await getSession();
  const { data: priv } = await supabase.from('profile_private').select('*').eq('id', user!.id).maybeSingle();

  let animalName: string | undefined;
  if (animal) {
    const { data } = await supabase.from('animals').select('name').eq('id', animal).maybeSingle();
    animalName = data?.name;
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6 sm:py-10">
      <Link href={animalName ? `/animais/${animal}` : '/perfil'} className="mb-3 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <BackIcon size={18} /> Voltar
      </Link>
      <h1 className="mb-5 text-2xl font-extrabold">Editar perfil</h1>
      <ProfileForm
        animalId={animalName ? animal : undefined}
        animalName={animalName}
        initial={{
          fullName: profile?.full_name ?? '',
          cpf: priv?.cpf ?? '',
          phone: priv?.phone ?? '',
          phoneVerified: Boolean(priv?.phone_verified_at),
          cep: priv?.cep ?? '',
          street: priv?.street ?? '',
          complement: priv?.complement ?? '',
          homeType: profile?.home_type ?? null,
          hasYard: profile?.has_yard ?? null,
          hasChildren: profile?.has_children ?? null,
          otherPets: profile?.other_pets ?? '',
          consented: Boolean(priv?.lgpd_consent_at),
          isAdopter: profile?.role === 'adopter',
        }}
      />
    </main>
  );
}
