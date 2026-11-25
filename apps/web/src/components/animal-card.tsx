import { getI18n } from '@/i18n/server';
import Link from 'next/link';
import { formatAge, formatDistance, formatRating, sexLabel, SIZE_LABEL, type AnimalSex, type AnimalSize, animalPath } from '@viralar/shared';
import { photoUrl, tintFor } from '@/lib/utils';
import { PawIcon, VerifiedIcon } from './icons';

export type AnimalCardData = {
  id: string;
  code?: string | null;
  name: string;
  sex: AnimalSex;
  size: AnimalSize;
  age_months: number | null;
  distance_km?: number | null;
  cover_path: string | null;
  ngo_name: string;
  ngo_verified: boolean;
  ngo_rating: number | null;
  neutered?: boolean | null;
  /** Data de publicação: anúncio parado há 60+ dias ganha o selo "esperando há X meses". */
  published_at?: string | null;
};

export async function AnimalCard({ a }: { a: AnimalCardData }) {
  const { t, lang } = await getI18n();
  const img = photoUrl(a.cover_path);
  const rating = formatRating(a.ngo_rating, lang);
  const waitingMonths = a.published_at ? Math.floor((Date.now() - new Date(a.published_at).getTime()) / (30 * 864e5)) : 0;
  return (
    <Link href={animalPath(a)} className="card flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative flex h-40 items-center justify-center" style={{ background: tintFor(a.name) }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={t('Foto de {name}', { name: a.name })} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <PawIcon size={40} className="text-ink/30" />
        )}
        {a.distance_km != null && (
          <span className="absolute top-2.5 left-2.5 rounded-lg bg-white px-2 py-0.5 text-[11px] font-bold">
            {formatDistance(a.distance_km, lang)}
          </span>
        )}
        {waitingMonths >= 2 && (
          <span className="absolute right-2.5 bottom-2.5 rounded-lg bg-accent px-2 py-0.5 text-[11px] font-bold text-ink">
            {waitingMonths >= 12 ? t('Esperando há mais de 1 ano') : t('Esperando há {n} meses', { n: waitingMonths })}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 px-3.5 pt-3 pb-3.5">
        <span className="text-base font-extrabold">{a.name}</span>
        <span className="text-[13px] text-muted">
          {t(sexLabel(a.sex))} · {formatAge(a.age_months, lang)} · {t(SIZE_LABEL[a.size])}
        </span>
        <span className="mt-1.5 flex items-center gap-1 truncate text-xs font-semibold">
          {a.ngo_verified && <VerifiedIcon size={13} className="shrink-0 text-brand" />}
          {a.ngo_name} · {rating ? `★ ${rating}` : t('Nova na plataforma')}
        </span>
      </div>
    </Link>
  );
}
