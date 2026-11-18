import { getSession } from '@/lib/supabase/server';
import { CompleteProfileForm } from './complete-profile-form';

export const metadata = { title: 'Completar perfil' };

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
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-1 text-2xl font-extrabold">Completar perfil</h1>
      <p className="mb-6 text-sm text-muted">Necessário apenas para pedir uma adoção.</p>
      <div className="card p-6">
        <CompleteProfileForm
          animalId={animalName ? animal : undefined}
          animalName={animalName}
          initial={{
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
          }}
        />
      </div>
    </main>
  );
}
