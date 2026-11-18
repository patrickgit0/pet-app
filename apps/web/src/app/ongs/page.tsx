import Link from 'next/link';
import { formatRating } from '@adotai/shared';
import { createClient } from '@/lib/supabase/server';
import { initials } from '@/lib/utils';
import { VerifiedIcon } from '@/components/icons';

export const metadata = { title: 'ONGs parceiras' };

export default async function Page() {
  const supabase = await createClient();
  const { data: ngos } = await supabase
    .from('ngos')
    .select('id, name, slug, neighborhood, city, verified_at, rating, completed_adoptions, description')
    .order('verified_at', { ascending: false, nullsFirst: false })
    .order('rating', { ascending: false, nullsFirst: false });

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-extrabold">ONGs parceiras</h1>
      <p className="mb-6 text-sm text-muted">A nota é calculada pelo Adotaí com base em adoções bem-sucedidas, acompanhamento pós-adoção, avaliações, tempo de resposta e transparência.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {(ngos ?? []).map((n) => (
          <Link key={n.id} href={`/ongs/${n.slug}`} className="card flex gap-4 p-5 hover:shadow-md">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand font-extrabold text-white">{initials(n.name)}</span>
            <span className="flex flex-col gap-1">
              <span className="flex items-center gap-1 font-extrabold">{n.name} {n.verified_at && <VerifiedIcon className="text-brand" />}</span>
              <span className="text-xs text-muted">{n.neighborhood}, {n.city} · {formatRating(n.rating) ? `★ ${formatRating(n.rating)}` : 'Nova na plataforma'} · {n.completed_adoptions} adoções</span>
              {n.description && <span className="line-clamp-2 text-sm text-ink-2">{n.description}</span>}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
