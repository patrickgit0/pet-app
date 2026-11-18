import { getSession } from '@/lib/supabase/server';
import { AnimalCard } from '@/components/animal-card';

export const metadata = { title: 'Favoritos' };

export default async function Page() {
  const { supabase } = await getSession();
  const { data } = await supabase
    .from('favorites')
    .select('animals(id, name, sex, size, birth_date_estimate, status, animal_photos(storage_path, position), ngos(name, verified_at, rating))')
    .order('created_at', { ascending: false });
  const animals = (data ?? []).map((f) => f.animals).filter((a): a is NonNullable<typeof a> => Boolean(a));
  const months = (b: string | null) => (b ? Math.max(0, Math.round((Date.now() - new Date(b).getTime()) / 2.63e9)) : null);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-5 text-2xl font-extrabold">Favoritos</h1>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        {animals.map((a) => (
          <AnimalCard key={a.id} a={{
            id: a.id, name: a.name, sex: a.sex, size: a.size, age_months: months(a.birth_date_estimate),
            cover_path: [...(a.animal_photos ?? [])].sort((x, y) => x.position - y.position)[0]?.storage_path ?? null,
            ngo_name: a.ngos?.name ?? '', ngo_verified: Boolean(a.ngos?.verified_at), ngo_rating: a.ngos?.rating ?? null,
          }} />
        ))}
      </div>
      {!animals.length && <p className="card p-8 text-center text-muted">Você ainda não favoritou nenhum animal.</p>}
    </main>
  );
}
