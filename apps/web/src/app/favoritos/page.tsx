import { getI18n, pageTitle } from '@/i18n/server';
import { getSession } from '@/lib/supabase/server';
import { AnimalCard } from '@/components/animal-card';

export const generateMetadata = pageTitle('Favoritos');

export default async function Page() {
  const { supabase } = await getSession();
  const { t } = await getI18n();
  const { data } = await supabase
    .from('favorites')
    .select('animals(id, name, code, sex, size, birth_date_estimate, status, animal_photos(storage_path, position), ngos(name, verified_at, rating))')
    .order('created_at', { ascending: false });
  const animals = (data ?? []).map((f) => f.animals).filter((a): a is NonNullable<typeof a> => Boolean(a));
  const months = (b: string | null) => (b ? Math.max(0, Math.round((Date.now() - new Date(b).getTime()) / 2.63e9)) : null);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="mb-5 text-2xl font-extrabold">{t('Favoritos')}</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] sm:gap-4">
        {animals.map((a) => (
          <AnimalCard key={a.id} a={{
            id: a.id, code: a.code, name: a.name, sex: a.sex, size: a.size, age_months: months(a.birth_date_estimate),
            cover_path: [...(a.animal_photos ?? [])].sort((x, y) => x.position - y.position)[0]?.storage_path ?? null,
            ngo_name: a.ngos?.name ?? '', ngo_verified: Boolean(a.ngos?.verified_at), ngo_rating: a.ngos?.rating ?? null,
          }} />
        ))}
      </div>
      {!animals.length && <p className="card p-8 text-center text-muted">{t('Você ainda não favoritou nenhum animal.')}</p>}
    </main>
  );
}
