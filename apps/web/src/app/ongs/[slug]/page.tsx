import { ReportButton } from '@/components/report-button';
import { NgoContact } from '@/components/ngo-contact';
import { getI18n } from '@/i18n/server';
import { notFound } from 'next/navigation';
import { formatRating } from '@adotai/shared';
import { createClient } from '@/lib/supabase/server';
import { initials } from '@/lib/utils';
import { VerifiedIcon } from '@/components/icons';
import { AnimalCard } from '@/components/animal-card';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { t, lang } = await getI18n();
  const { data: ngo } = await supabase.from('ngos').select('*').eq('slug', slug).maybeSingle();
  if (!ngo) notFound();

  const [{ data: animals }, { data: reviews }] = await Promise.all([
    supabase.from('animals').select('id, name, code, sex, size, birth_date_estimate, animal_photos(storage_path, position)')
      .eq('ngo_id', ngo.id).eq('status', 'available').order('published_at', { ascending: false }),
    supabase.from('reviews').select('id, stars, comment, created_at').eq('ngo_id', ngo.id).order('created_at', { ascending: false }).limit(6),
  ]);
  const rating = formatRating(ngo.rating, lang);
  const months = (b: string | null) => (b ? Math.max(0, Math.round((Date.now() - new Date(b).getTime()) / 2.63e9)) : null);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header className="card flex flex-wrap items-center gap-5 p-5 sm:p-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-xl font-extrabold text-white">{initials(ngo.name)}</span>
        <div className="flex flex-1 flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold">{ngo.name} {ngo.verified_at && <VerifiedIcon size={18} className="text-brand" />}</h1>
          <span className="text-sm text-muted">{ngo.neighborhood}, {ngo.city}/{ngo.state}</span>
          {ngo.description && <p className="max-w-2xl text-sm text-ink-2">{ngo.description}</p>}
          {ngo.instagram && (
            <a href={`https://instagram.com/${ngo.instagram}`} target="_blank" rel="noopener noreferrer"
              className="mt-1 inline-flex min-h-9 items-center gap-1.5 self-start rounded-full bg-field px-3 text-sm font-semibold hover:bg-line">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
              @{ngo.instagram}
            </a>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat k={t('Nota')} v={rating ?? t('Nova')} />
          <Stat k={t('Adoções')} v={String(ngo.completed_adoptions)} />
          <Stat k={t('Responde em')} v={ngo.median_response_minutes == null ? '—' : ngo.median_response_minutes < 60 ? `${ngo.median_response_minutes} min` : `${Math.round(ngo.median_response_minutes / 60)} h`} />
        </div>
      </header>

      <NgoContact ngo={ngo} loggedIn={Boolean(user)} next={`/ongs/${ngo.slug}`} />

      {ngo.pix_key && (
        <p className="rounded-xl bg-brand-soft p-4 text-sm">{t('Quer ajudar a {name}? Doe via Pix:', { name: ngo.name })} <strong className="select-all">{ngo.pix_key}</strong></p>
      )}

      <section>
        <h2 className="mb-3 text-lg font-extrabold">{t('Animais disponíveis ({n})', { n: animals?.length ?? 0 })}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] sm:gap-4">
          {(animals ?? []).map((a) => (
            <AnimalCard key={a.id} a={{
              id: a.id, code: a.code, name: a.name, sex: a.sex, size: a.size, age_months: months(a.birth_date_estimate),
              cover_path: [...(a.animal_photos ?? [])].sort((x, y) => x.position - y.position)[0]?.storage_path ?? null,
              ngo_name: ngo.name, ngo_verified: Boolean(ngo.verified_at), ngo_rating: ngo.rating,
            }} />
          ))}
        </div>
      </section>

      {!!reviews?.length && (
        <section>
          <h2 className="mb-3 text-lg font-extrabold">{t('Avaliações de quem adotou')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="card p-4 text-sm">
                <span className="font-bold text-accent-ink">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                {r.comment && <p className="mt-1 text-ink-2">{r.comment}</p>}
                <ReportButton type="review" id={r.id} loggedIn={Boolean(user)} className="mt-2 block" />
              </div>
            ))}
          </div>
        </section>
      )}
      <ReportButton type="ngo" id={ngo.id} loggedIn={Boolean(user)} label="Denunciar esta ONG" className="self-start" />
    </main>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return <div className="rounded-xl bg-ground px-3 py-2"><div className="text-lg font-extrabold">{v}</div><div className="text-[11px] text-muted">{k}</div></div>;
}
